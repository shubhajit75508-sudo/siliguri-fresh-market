import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { DELIVERY_TIERS } from "@/lib/delivery-zone";
import {
  aggregateCustomers,
  buildCohorts,
  computeTotals,
  dayBounds,
  dayKey,
  dayOfWeek,
  firstOrderFlags,
  hourOfDay,
  num,
  orderFinancials,
  pct,
  previousWindow,
  rangeDays,
  resolveRange,
  round2,
  type AnalyticsOrder,
  type Catalog,
  type CatalogEntry,
  type Cohort,
  type PeriodTotals,
  type WeightPrice,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Columns guaranteed to exist on `orders`.
 *
 * `order_source` / `extra_charges` come from `supabase/manual_orders_migration.sql`,
 * which may not be applied to the live database yet. Requesting an unknown column
 * makes PostgREST reject the WHOLE query, so they are requested separately and
 * dropped automatically if the database does not have them.
 */
const BASE_COLUMNS =
  "id, items, total, subtotal, delivery_fee, discount, status, address_snapshot, delivered_at, created_at, customer_name, customer_email, customer_phone, payment_method, payment_status, delivery_boy_id";
const OPTIONAL_COLUMNS = ["order_source", "extra_charges"] as const;

/**
 * Columns this database is known to support, learned on first use. Cached for the
 * life of the process so a missing column costs one extra query, not one per row.
 */
const supportedOptionalColumns = new Set<string>(OPTIONAL_COLUMNS);

function isMissingColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("42703") || m.includes("unknown column");
}

/** Drops optional columns the database rejected, so later requests skip them. */
function dropRejectedColumns(message: string): string[] {
  const m = message.toLowerCase();
  const dropped = [...supportedOptionalColumns].filter((c) => m.includes(c));
  for (const c of dropped) supportedOptionalColumns.delete(c);
  return dropped;
}

function selectColumns(): string {
  return [...supportedOptionalColumns].length > 0
    ? `${BASE_COLUMNS}, ${[...supportedOptionalColumns].join(", ")}`
    : BASE_COLUMNS;
}

/**
 * Minimal structural type for the bits of the Supabase query builder we use.
 * Keeps the helpers below free of `any` while staying easy to fake in tests.
 */
type OrderQueryResult = { data?: unknown; error: { message: string } | null };
type OrderQuery = PromiseLike<OrderQueryResult> & {
  select(cols: string): OrderQuery;
  eq(col: string, val: unknown): OrderQuery;
  gte(col: string, val: unknown): OrderQuery;
  lte(col: string, val: unknown): OrderQuery;
  in(col: string, vals: readonly unknown[]): OrderQuery;
  order(col: string, opts: { ascending: boolean }): OrderQuery;
  limit(n: number): OrderQuery;
};
type SupabaseLike = { from(table: string): OrderQuery };

async function fetchOrders(
  sb: SupabaseLike,
  apply: (q: OrderQuery) => OrderQuery,
  label: string
): Promise<{ rows: AnalyticsOrder[] | null; error: string | null }> {
  let r = await apply(sb.from("orders").select(selectColumns()));
  if (r.error && isMissingColumnError(r.error.message)) {
    const dropped = dropRejectedColumns(r.error.message);
    if (dropped.length > 0) {
      console.warn(`[growth] ${label}: database is missing ${dropped.join(", ")}; retrying without them`);
      r = await apply(sb.from("orders").select(selectColumns()));
    }
  }
  if (!r.error) return { rows: (r.data ?? []) as AnalyticsOrder[], error: null };
  console.error(`[growth] ${label} query failed:`, r.error.message);
  return { rows: [], error: r.error.message };
}

/** Load the product catalog needed to price and cost the given orders. */
async function buildCatalog(sb: SupabaseLike, orders: AnalyticsOrder[]): Promise<Catalog> {
  const ids = new Set<string>();
  for (const o of orders) {
    for (const it of o.items ?? []) if (it?.product?.id) ids.add(String(it.product.id));
  }
  const catalog: Catalog = new Map();
  const all = [...ids];
  for (let i = 0; i < all.length; i += 200) {
    const slice = all.slice(i, i + 200);
    let res = (await sb
      .from("products")
      .select("id, category, price, weight_prices, buying_prices")
      .in("id", slice)) as { data?: unknown; error: { message: string } | null };
    // `buying_prices` lives in profit_analytics_migration.sql; fall back without it
    // so a missing column degrades the report instead of emptying it.
    if (res.error && isMissingColumnError(res.error.message) && res.error.message.toLowerCase().includes("buying_prices")) {
      console.warn("[growth] database is missing products.buying_prices; costs will be estimated as unavailable");
      res = (await sb
        .from("products")
        .select("id, category, price, weight_prices")
        .in("id", slice)) as { data?: unknown; error: { message: string } | null };
    }
    const { data, error } = res;
    if (error) {
      console.error("[growth] product catalog query failed:", error.message);
      continue;
    }
    for (const p of (data ?? []) as Record<string, unknown>[]) {
      catalog.set(String(p.id), {
        category: String(p.category ?? "other"),
        basePrice: num(p.price),
        weightPrices: Array.isArray(p.weight_prices) ? (p.weight_prices as WeightPrice[]) : [],
        buyingPrices: Array.isArray(p.buying_prices) ? (p.buying_prices as WeightPrice[]) : [],
      } satisfies CatalogEntry);
    }
  }
  return catalog;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const sb = client as unknown as SupabaseLike;

  const { searchParams } = new URL(req.url);
  const range = resolveRange(searchParams.get("from"), searchParams.get("to"));
  const curStart = dayBounds(range.from).startIso;
  const curEnd = dayBounds(range.to).endIso;
  const prev = previousWindow(range.from, range.to);
  const prevStart = dayBounds(prev.from).startIso;
  const prevEnd = dayBounds(prev.to).endIso;

  // ── Delivered orders in the current window (revenue / profit / mix) ──────────
  const deliveredRes = await fetchOrders(
    sb,
    (q) => q.eq("status", "delivered").gte("delivered_at", curStart).lte("delivered_at", curEnd),
    "delivered"
  );
  if (deliveredRes.error) {
    return NextResponse.json({ error: "Could not load delivered orders" }, { status: 500 });
  }
  const delivered = deliveredRes.rows ?? [];

  // ── Delivered orders in the previous window (period-over-period) ─────────────
  // Same status and window length, so the comparison is apples to apples.
  const prevDeliveredRes = await fetchOrders(
    sb,
    (q) => q.eq("status", "delivered").gte("delivered_at", prevStart).lte("delivered_at", prevEnd),
    "previous-period delivered"
  );
  if (prevDeliveredRes.error) {
    return NextResponse.json({ error: "Could not load previous period" }, { status: 500 });
  }
  const prevDelivered = prevDeliveredRes.rows ?? [];

  // ── Every order created in the window (funnel / customers / demand shape) ────
  const allRes = await fetchOrders(
    sb,
    (q) => q.gte("created_at", curStart).lte("created_at", curEnd),
    "all orders"
  );
  if (allRes.error) {
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
  const all = allRes.rows ?? [];

  // ── Lifetime customer history, for honest new-vs-repeat classification ───────
  // Only identity + timestamp columns, so this stays cheap even with many orders.
  const lifetimeRes = await fetchOrders(
    sb,
    (q) => q
      .select("id, created_at, customer_name, customer_email, customer_phone, total")
      .order("created_at", { ascending: true })
      .limit(50_000),
    "lifetime customers"
  );
  const lifetime = lifetimeRes.rows ?? [];

  // ── Catalog for both windows (shared so both use identical pricing) ─────────
  const catalog = await buildCatalog(sb, [...delivered, ...prevDelivered]);

  // ══════════════════ headline totals ══════════════════
  const totals: PeriodTotals = computeTotals(delivered, catalog);
  const prevTotals: PeriodTotals = computeTotals(prevDelivered, catalog);

  const revenueChangeAmount = round2(totals.revenue - prevTotals.revenue);
  const revenueChangePct =
    prevTotals.revenue > 0 ? round2((revenueChangeAmount / prevTotals.revenue) * 100) : totals.revenue > 0 ? null : 0;
  const profitChangeAmount = round2(totals.profit - prevTotals.profit);
  const profitChangePct =
    prevTotals.profit > 0 ? round2((profitChangeAmount / prevTotals.profit) * 100) : totals.profit > 0 ? null : 0;
  const orderChangePct =
    prevTotals.orderCount > 0 ? round2(((totals.orderCount - prevTotals.orderCount) / prevTotals.orderCount) * 100) : null;

  const growth = {
    from: prev.from,
    to: prev.to,
    days: prevTotals.orderCount >= 0 ? range.days : 0,
    revenue: round2(prevTotals.revenue),
    profit: round2(prevTotals.profit),
    orderCount: prevTotals.orderCount,
    aov: prevTotals.orderCount > 0 ? round2(prevTotals.revenue / prevTotals.orderCount) : 0,
    revenueChangeAmount,
    revenueChangePct,
    profitChangeAmount,
    profitChangePct,
    orderChangePct,
  };

  // ══════════════════ daily series (zero-filled, delivery fees included) ══════
  const days = rangeDays(range.from, range.to);
  const dailyMap = new Map(
    days.map((d) => [
      d,
      { date: d, revenue: 0, merchRevenue: 0, cost: 0, profit: 0, deliveryFees: 0, discounts: 0, orderCount: 0, itemsSold: 0 },
    ])
  );
  const categoryMap = new Map<string, { category: string; orders: number; revenue: number; cost: number; profit: number; qty: number }>();
  const productMapAgg = new Map<string, { id: string; name: string; category: string; qty: number; revenue: number; cost: number; unitsSold: number; orderCount: number }>();
  const zones = DELIVERY_TIERS.map((t) => ({ label: t.label, maxKm: t.maxKm, orders: 0, revenue: 0, aov: 0 }));
  const areaMap = new Map<string, { area: string; orders: number; revenue: number }>();
  const paymentMix = {
    cod: { count: 0, revenue: 0, profit: 0, orders: 0 },
    upi: { count: 0, revenue: 0, profit: 0, orders: 0 },
  };
  const weightUnits = new Map<string, { weight: string; qty: number; revenue: number; orders: number }>();
  let zoneUnbucketed = 0;
  let deliveredWithoutDistance = 0;

  for (const o of delivered) {
    const f = orderFinancials(o, catalog);
    const snap = (o.address_snapshot ?? {}) as Record<string, unknown>;
    const dk = dayKey(o.delivered_at ?? o.created_at);
    const day = dailyMap.get(dk);
    if (day) {
      day.revenue += f.revenue;
      day.merchRevenue += f.net;
      day.cost += f.cost;
      day.profit += f.profit;
      day.deliveryFees += f.deliveryFee;
      day.discounts += f.discount;
      day.orderCount += 1;
      day.itemsSold += f.itemsSold;
    }

    // Per-line attribution: categories, products, weight tiers.
    const catsSeen = new Set<string>();
    for (const l of f.lines) {
      catsSeen.add(l.category);
      const pid = l.productId || `name:${l.name}`;
      const pa =
        productMapAgg.get(pid) ??
        { id: pid, name: l.name, category: l.category, qty: 0, revenue: 0, cost: 0, unitsSold: 0, orderCount: 0 };
      pa.qty += l.qty;
      pa.revenue += l.lineNet;
      pa.cost += l.lineCost;
      pa.unitsSold += 1;
      pa.orderCount += 1;
      productMapAgg.set(pid, pa);

      const ca = categoryMap.get(l.category) ?? { category: l.category, orders: 0, revenue: 0, cost: 0, profit: 0, qty: 0 };
      ca.revenue += l.lineNet;
      ca.cost += l.lineCost;
      ca.qty += l.qty;
      categoryMap.set(l.category, ca);

      const item = (o.items ?? []).find((i) => String(i?.product?.id ?? "") === l.productId);
      const label = (item?.selectedWeight || "").trim();
      if (label) {
        const wa = weightUnits.get(label) ?? { weight: label, qty: 0, revenue: 0, orders: 0 };
        wa.qty += l.qty;
        wa.revenue += l.lineNet;
        wa.orders += 1;
        weightUnits.set(label, wa);
      }
    }
    for (const c of catsSeen) {
      const ca = categoryMap.get(c);
      if (ca) ca.orders += 1;
    }

    const pm: "cod" | "upi" = o.payment_method === "upi" ? "upi" : "cod";
    paymentMix[pm].count += 1;
    paymentMix[pm].revenue += f.revenue;
    paymentMix[pm].profit += f.profit;
    paymentMix[pm].orders += 1;

    const distRaw = snap.distance_km;
    const dist = distRaw === undefined || distRaw === null || distRaw === "" ? null : num(distRaw);
    if (dist === null || dist < 0) {
      deliveredWithoutDistance += 1;
      zoneUnbucketed += 1;
    } else {
      const b = zones.find((z) => dist <= z.maxKm);
      if (b) {
        b.orders += 1;
        b.revenue += f.revenue;
      } else zoneUnbucketed += 1;
    }

    const area = String(snap.area || snap.line1 || "Unknown").trim().slice(0, 60) || "Unknown";
    const ar = areaMap.get(area) ?? { area, orders: 0, revenue: 0 };
    ar.orders += 1;
    ar.revenue += f.revenue;
    areaMap.set(area, ar);
  }

  for (const z of zones) z.aov = z.orders > 0 ? round2(z.revenue / z.orders) : 0;

  const daily = days.map((d) => {
    const v = dailyMap.get(d)!;
    return {
      date: d,
      revenue: round2(v.revenue),
      merchRevenue: round2(v.merchRevenue),
      cost: round2(v.cost),
      profit: round2(v.profit),
      deliveryFees: round2(v.deliveryFees),
      discounts: round2(v.discounts),
      orderCount: v.orderCount,
      itemsSold: v.itemsSold,
    };
  });
  // 7-day trailing average, aligned to `daily`.
  const rolling7 = daily.map((_, i) => {
    const start = Math.max(0, i - 6);
    const win = daily.slice(start, i + 1);
    return round2(win.reduce((s, x) => s + x.revenue, 0) / win.length);
  });

  const categories = [...categoryMap.values()]
    .map((c) => ({
      category: c.category,
      orders: c.orders,
      qty: c.qty,
      revenue: round2(c.revenue),
      cost: round2(c.cost),
      profit: round2(c.revenue - c.cost),
      margin: round2(pct(c.revenue - c.cost, c.revenue)),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProducts = [...productMapAgg.values()]
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      quantity: round2(p.qty),
      revenue: round2(p.revenue),
      cost: round2(p.cost),
      profit: round2(p.revenue - p.cost),
      margin: round2(pct(p.revenue - p.cost, p.revenue)),
    }))
    .sort((a, b) => b.profit - a.profit);

  const weightMix = [...weightUnits.values()]
    .map((w) => ({ ...w, revenue: round2(w.revenue), qty: round2(w.qty) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);

  const zoneBuckets = {
    buckets: zones.map((z) => ({ label: z.label, orders: z.orders, revenue: round2(z.revenue), aov: z.aov })),
    outOfRange: zoneUnbucketed,
    missingDistance: deliveredWithoutDistance,
    areas: [...areaMap.values()]
      .map((a) => ({ ...a, revenue: round2(a.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12),
  };

  // ══════════════════ customers: lifetime-aware ══════════════════
  // New vs repeat is decided PER ORDER using the customer's lifetime history, so a
  // customer's very first order is never counted as a repeat and a long-standing
  // customer is never counted as new just because the window is short.
  const lifetimeCustomers = aggregateCustomers(lifetime);
  const rangeCustomers = aggregateCustomers(all);
  const isFirstOrder = firstOrderFlags(lifetime);
  let newCustomerCount = 0;
  const newTrendMap = new Map<string, number>();
  const repeatTrendMap = new Map<string, number>();
  const ordersTrendMap = new Map<string, number>();
  for (const o of all) {
    const dk = dayKey(o.created_at);
    if (isFirstOrder.get(o.id)) newCustomerCount += 1;
    if (!dk) continue;
    if (isFirstOrder.get(o.id)) newTrendMap.set(dk, (newTrendMap.get(dk) ?? 0) + 1);
    else repeatTrendMap.set(dk, (repeatTrendMap.get(dk) ?? 0) + 1);
    ordersTrendMap.set(dk, (ordersTrendMap.get(dk) ?? 0) + 1);
  }
  const newCustomers = newCustomerCount;
  const repeatOrders = all.length - newCustomerCount;
  const returning = rangeCustomers.filter((c) => {
    const lc = lifetimeCustomers.find((l) => l.key === c.key);
    return (lc?.orders ?? 0) > 1;
  }).length;
  // newCustomers + repeatOrders must always equal the orders placed in the window.
  const customerTrend = days.map((d) => ({
    date: d,
    newCustomers: newTrendMap.get(d) ?? 0,
    repeatOrders: repeatTrendMap.get(d) ?? 0,
    total: ordersTrendMap.get(d) ?? 0,
  }));

  // ══════════════════ demand shape: when do people order ══════════════════
  const dowNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dowAgg = dowNames.map((label) => ({ label, short: label.slice(0, 3), orders: 0, revenue: 0 }));
  const hourAgg = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
  // Real day-of-week × hour-of-day intersection: 7 rows (Sun first) × 24 columns.
  const heatOrders = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const heatRevenue = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  for (const o of all) {
    const w = dayOfWeek(o.created_at);
    const h = hourOfDay(o.created_at);
    if (w >= 0 && w < 7) {
      dowAgg[w].orders += 1;
      dowAgg[w].revenue += num(o.total);
    }
    if (h >= 0 && h < 24) {
      hourAgg[h].orders += 1;
      hourAgg[h].revenue += num(o.total);
    }
    if (w >= 0 && w < 7 && h >= 0 && h < 24) {
      heatOrders[w][h] += 1;
      heatRevenue[w][h] += num(o.total);
    }
  }
  const dow = dowAgg.map((d) => ({ ...d, revenue: round2(d.revenue), aov: d.orders > 0 ? round2(d.revenue / d.orders) : 0 }));
  const hour = hourAgg.map((h) => ({ ...h, revenue: round2(h.revenue), aov: h.orders > 0 ? round2(h.revenue / h.orders) : 0 }));
  const peakHour = hour.reduce((best, h) => (h.orders > best.orders ? h : best), hour[0]);
  const bestDay = dow.reduce((best, d) => (d.orders > best.orders ? d : best), dow[0]);

  const cohorts: Cohort[] = buildCohorts(lifetime);

  // ══════════════════ order funnel ══════════════════
  const byStatus = new Map<string, number>();
  for (const o of all) {
    const s = String(o.status ?? "unknown");
    byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
  }
  const cancelledCount = byStatus.get("cancelled") ?? 0;
  const deliveredCount = totals.orderCount;
  const totalOrdersAll = all.length;
  const closed = deliveredCount + cancelledCount;

  // Delivery-partner payouts are informational only and are NEVER deducted from
  // profit: the customer-paid delivery fee is retained by the shop, and the boy's
  // payout is a separate cash flow. Nothing writes to the `delivery_earnings`
  // ledger yet, so this is the flat commission × delivered orders that were
  // actually assigned to a rider.
  const partnerCommission = num(process.env.DELIVERY_COMMISSION) || 40;
  const partnerPayouts = delivered.filter((o) => !!o.delivery_boy_id).length * partnerCommission;

  const summary = {
    revenue: round2(totals.revenue),
    merchRevenue: round2(totals.merchRevenue),
    cost: round2(totals.cost),
    profit: round2(totals.profit),
    netProfit: round2(totals.profit),
    deliveryFees: round2(totals.deliveryFees),
    discounts: round2(totals.discounts),
    extraCharges: round2(totals.extraCharges),
    partnerPayouts: round2(partnerPayouts),
    margin: round2(pct(totals.profit, totals.revenue)),
    aov: deliveredCount > 0 ? round2(totals.revenue / deliveredCount) : 0,
    itemsSold: totals.itemsSold,
    avgItemsPerOrder: deliveredCount > 0 ? round2(totals.itemsSold / deliveredCount) : 0,
    avgOrderValue: deliveredCount > 0 ? round2(totals.revenue / deliveredCount) : 0,
    orderCount: deliveredCount,
  };

  const reconciliation = {
    storedTotal: round2(delivered.reduce((s, o) => s + num(o.total), 0)),
    computedRevenue: summary.revenue,
    delta: round2(summary.revenue - delivered.reduce((s, o) => s + num(o.total), 0)),
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    timezone: "Asia/Kolkata",
    range: {
      from: range.from,
      to: range.to,
      days: range.days,
      defaulted: range.defaulted,
      seriesTruncated: range.truncatedSeries,
    },
    summary,
    reconciliation,
    dataQuality: {
      missingCostItems: totals.missingCostItems,
      estimatedCostItems: totals.estimatedCostItems,
      ordersWithoutCost: delivered.filter((o) => (o.items ?? []).some((i) => !num(i?.unitCost) && num(i?.unitPrice) === 0)).length,
      lifetimeSampleTruncated: lifetime.length >= 50_000,
    },
    growth,
    daily,
    rolling7,
    categories,
    topProducts,
    weightMix,
    paymentMix,
    zones: zoneBuckets,
    dow,
    hour,
    heatmap: {
      dayLabels: dowNames,
      hours: Array.from({ length: 24 }, (_, h) => h),
      orders: heatOrders,
      revenue: heatOrders.map((_, w) => heatRevenue[w].map((v) => round2(v))),
    },
    peak: { hour: peakHour, day: bestDay },
    customers: {
      totalCustomers: rangeCustomers.length,
    newCustomers,
    repeatOrders,
    returningCustomers: returning,
    /** Share of CUSTOMERS in the window who had ordered before it, not before today. */
    repeatRate: round2(pct(returning, rangeCustomers.length)),
      lifetimeCustomers: lifetimeCustomers.length,
      avgOrdersPerCustomer: rangeCustomers.length > 0 ? round2(totalOrdersAll / rangeCustomers.length) : 0,
      topSpenders: [...rangeCustomers]
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 20)
        .map((c) => ({
          name: c.name || c.email || c.phone || "Guest",
          email: c.email,
          phone: c.phone,
          orders: c.orders,
          spend: round2(c.spend),
          aov: round2(c.aov),
          lastAt: c.lastAt,
          repeat: c.repeat,
        })),
    },
    customerTrend,
    cohorts,
    orders: {
      total: totalOrdersAll,
      delivered: deliveredCount,
      cancelled: cancelledCount,
      pending: (byStatus.get("received") ?? 0) + (byStatus.get("accepted") ?? 0) + (byStatus.get("packed") ?? 0),
      outForDelivery: byStatus.get("out_for_delivery") ?? 0,
      statusBreakdown: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
      deliverySuccessRate: closed > 0 ? round2(pct(deliveredCount, closed)) : 0,
      avgItemsPerOrder: summary.avgItemsPerOrder,
    },
    margin: summary.margin,
    netMargin: summary.margin,
  });
}
