import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { DELIVERY_TIERS } from "@/lib/delivery-zone";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type WeightPrice = { weight: string; price: number };

type OrderItemRow = {
  product?: { id?: string; name?: string; price?: number } | null;
  quantity?: number;
  selectedWeight?: string | null;
};

type OrderRow = {
  id: string;
  items?: OrderItemRow[] | null;
  total?: number | null;
  status?: string | null;
  address_snapshot?: Record<string, unknown> | null;
  delivered_at?: string | null;
  created_at?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  payment_method?: string | null;
};

function parseWeightMultiplier(weight?: string | null): number {
  if (!weight) return 1;
  const w = String(weight).trim().toLowerCase();
  const m = w.match(/^(\d+(?:\.\d+)?)\s*(g|kg)$/);
  if (!m) return 1;
  const val = parseFloat(m[1]);
  return m[2] === "g" ? val / 1000 : val;
}

function priceForWeight(basePrice: number, weight: string | undefined, ps?: WeightPrice[]): number {
  if (ps && Array.isArray(ps) && ps.length && weight) {
    const match = ps.find((p) => String(p.weight).toLowerCase() === weight.toLowerCase());
    if (match) return match.price;
  }
  return basePrice * parseWeightMultiplier(weight);
}

function dayKey(iso: string | null | undefined): string {
  try {
    return (iso || "").slice(0, 10);
  } catch {
    return "";
  }
}

function bucketedOrders(rangeDays: number): string[] {
  const out: string[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Total number of days in the query range (for AOV / daily averages)
function countDays(from: string | null, to: string | null): number {
  if (!from && !to) return 365;
  const start = from ? new Date(`${from}T00:00:00`) : new Date("2000-01-01");
  const end = to ? new Date(`${to}T23:59:59`) : new Date();
  const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  return diff;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const days = countDays(from, to);

  // --- Fetch delivered orders in range (for profit/categories/zones) ---
  let deliveredQuery = supabaseAdmin
    .from("orders")
    .select("id, items, total, status, address_snapshot, delivered_at, created_at, customer_email, customer_phone, payment_method")
    .eq("status", "delivered");
  if (from) deliveredQuery = deliveredQuery.gte("delivered_at", `${from}T00:00:00`);
  if (to) deliveredQuery = deliveredQuery.lte("delivered_at", `${to}T23:59:59.999`);
  const { data: rawDelivered, error: delivErr } = await deliveredQuery;
  if (delivErr) return NextResponse.json({ error: "Profit query failed" }, { status: 500 });
  const delivered = (rawDelivered ?? []) as unknown as OrderRow[];

  // --- Fetch ALL orders in created_at range (for customer / funnel / AOV trends) ---
  let allQuery = supabaseAdmin
    .from("orders")
    .select("id, items, total, status, address_snapshot, delivered_at, created_at, customer_email, customer_phone, payment_method");
  if (from) allQuery = allQuery.gte("created_at", `${from}T00:00:00`);
  if (to) allQuery = allQuery.lte("created_at", `${to}T23:59:59.999`);
  const { data: rawAll, error: allErr } = await allQuery;
  if (allErr) return NextResponse.json({ error: "Growth query failed" }, { status: 500 });
  const all = (rawAll ?? []) as unknown as OrderRow[];

  // --- Build product lookup (category, buying prices) from delivered order items ---
  const productIds = new Set<string>();
  for (const o of delivered) {
    for (const item of o.items ?? []) if (item.product?.id) productIds.add(String(item.product.id));
  }
  const productMap = new Map<string, { category: string; basePrice: number; weightPrices: WeightPrice[]; buyingPrices: WeightPrice[] }>();
  const ids = [...productIds];
  if (ids.length) {
    for (let i = 0; i < ids.length; i += 200) {
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, category, price, weight_prices, buying_prices")
        .in("id", ids.slice(i, i + 200));
      for (const p of products ?? []) {
        productMap.set(String(p.id), {
          category: String(p.category ?? "other"),
          basePrice: Number(p.price) || 0,
          weightPrices: Array.isArray(p.weight_prices) ? (p.weight_prices as WeightPrice[]) : [],
          buyingPrices: Array.isArray(p.buying_prices) ? (p.buying_prices as WeightPrice[]) : [],
        });
      }
    }
  }

  // ================= PROFIT / CATEGORY / ZONE aggregation (delivered only) =================
  const summary = { revenue: 0, cost: 0, profit: 0, deliveryFees: 0, orderCount: 0 };
  let missingCostItems = 0;
  const dailyMap = new Map<string, { date: string; revenue: number; cost: number; profit: number; orderCount: number }>();
  const categoryAgg = new Map<string, { category: string; orders: number; revenue: number; cost: number; profit: number; qty: number }>();
  const productAgg = new Map<string, { name: string; qty: number; revenue: number; cost: number; profit: number }>();

  // zone buckets by distance_km
  const zoneBuckets = DELIVERY_TIERS.map((t) => ({ ...t, orders: 0, revenue: 0, aov: 0 }));
  const areaAgg = new Map<string, { area: string; orders: number; revenue: number }>();
  let uncategorizedZone = 0;

  for (const o of delivered) {
    const snap = (o.address_snapshot ?? {}) as Record<string, unknown>;
    const deliveryFee = Number(snap.delivery_fee ?? 0) || 0;
    const distanceKm = snap.distance_km != null ? Number(snap.distance_km) : null;

    let orderRevenue = 0;
    let orderCost = 0;

    for (const item of o.items ?? []) {
      const prod = item.product;
      const pid = prod?.id ? String(prod.id) : "";
      const qty = Number(item.quantity ?? 1);
      const selW = item.selectedWeight ?? undefined;

      const info = productMap.get(pid);
      const basePrice = info ? info.basePrice : Number(prod?.price ?? 0);
      const wps = info?.weightPrices ?? [];
      const bps = info?.buyingPrices ?? [];

      if (!bps.length) missingCostItems += 1;

      const sellUnit = priceForWeight(basePrice, selW, wps.length ? wps : undefined);
      const buyUnit = priceForWeight(bps[0]?.price || 0, selW, bps.length ? bps : undefined);

      const itemRevenue = qty * sellUnit;
      orderRevenue += itemRevenue;
      orderCost += qty * buyUnit;

      const name = prod?.name || "Item";
      const pa = productAgg.get(name) ?? { name, qty: 0, revenue: 0, cost: 0, profit: 0 };
      pa.qty += qty;
      pa.revenue += itemRevenue;
      pa.cost += qty * buyUnit;
      productAgg.set(name, pa);

      const cat = info?.category || "other";
      const ca = categoryAgg.get(cat) ?? { category: cat, orders: 0, revenue: 0, cost: 0, profit: 0, qty: 0 };
      ca.orders = 1; // approximate — will fix below
      ca.revenue += itemRevenue;
      ca.cost += qty * buyUnit;
      ca.qty += qty;
      categoryAgg.set(cat, ca);
    }

    const orderProfit = (orderRevenue - orderCost) + deliveryFee;
    summary.revenue += orderRevenue;
    summary.cost += orderCost;
    summary.profit += orderProfit;
    summary.deliveryFees += deliveryFee;
    summary.orderCount += 1;

    const dk = dayKey(o.delivered_at || o.created_at);
    if (dk) {
      const day = dailyMap.get(dk) ?? { date: dk, revenue: 0, cost: 0, profit: 0, orderCount: 0 };
      day.revenue += orderRevenue;
      day.cost += orderCost;
      day.profit += orderProfit;
      day.orderCount += 1;
      dailyMap.set(dk, day);
    }

    // Zone bucket by distance_km
    if (distanceKm != null && distanceKm >= 0) {
      const bucket = zoneBuckets.find((z) => distanceKm <= z.maxKm);
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += orderRevenue;
      } else {
        uncategorizedZone += 1;
      }
    } else {
      uncategorizedZone += 1;
    }

    // Area bucket
    const area = String(snap.area || snap.line1 || "Unknown").trim().slice(0, 40);
    const ar = areaAgg.get(area) ?? { area, orders: 0, revenue: 0 };
    ar.orders += 1;
    ar.revenue += orderRevenue;
    areaAgg.set(area, ar);
  }

  // Fix category order counts (count each order once per category — approximate by counting unique orders)
  for (const ca of categoryAgg.values()) {
    ca.orders = 0;
  }
  for (const o of delivered) {
    const catsSeen = new Set<string>();
    for (const item of o.items ?? []) {
      const pid = item.product?.id ? String(item.product.id) : "";
      const info = productMap.get(pid);
      if (info) catsSeen.add(info.category);
    }
    for (const c of catsSeen) {
      const ca = categoryAgg.get(c);
      if (ca) ca.orders += 1;
    }
  }

  for (const z of zoneBuckets) z.aov = z.orders > 0 ? z.revenue / z.orders : 0;

  const zones = {
    buckets: zoneBuckets.map((z) => ({ label: z.label, orders: z.orders, revenue: z.revenue, aov: z.aov })),
    uncategorized: uncategorizedZone,
    areas: [...areaAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
  };

  const categories = [...categoryAgg.values()]
    .map((c) => ({ ...c, profit: c.revenue - c.cost, margin: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);
  const topProducts = [...productAgg.values()]
    .map((p) => ({ name: p.name, quantity: p.qty, revenue: p.revenue, cost: p.cost, profit: p.profit }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 20);

  const margin = summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0;

  // ================= CUSTOMER aggregation (by email or phone) =================
  // Use all orders (created_at range). Count per customer, ordered history.
  const custMap = new Map<string, { key: string; email: string; phone: string; name: string; orders: number; spend: number; firstAt: string; lastAt: string }>();
  const customerDaily = new Map<string, { date: string; newCustomers: number; repeatOrders: number; total: number }>();
  const dayKeys = bucketedOrders(Math.min(days, 60));

  // Pre-sort all orders by created_at for first-order detection
  const sortedByCreated = [...all].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  const firstOrderByCustomer = new Map<string, string>(); // key -> first created iso
  for (const o of sortedByCreated) {
    const key = (o.customer_email && o.customer_email.trim()) || String(o.customer_phone || "").trim() || o.id;
    if (key && !firstOrderByCustomer.has(key)) {
      firstOrderByCustomer.set(key, o.created_at || o.id);
    }
  }

  // Aggregate customers
  for (const o of all) {
    const key = (o.customer_email && o.customer_email.trim()) || String(o.customer_phone || "").trim() || o.id;
    const cust = custMap.get(key) ?? {
      key,
      email: o.customer_email || "",
      phone: o.customer_phone || "",
      name: o.customer_name as string ?? "",
      orders: 0,
      spend: 0,
      firstAt: o.created_at || "",
      lastAt: o.created_at || "",
    };
    cust.orders += 1;
    cust.spend += Number(o.total ?? 0);
    if (!cust.firstAt || (o.created_at && o.created_at < cust.firstAt)) cust.firstAt = o.created_at || cust.firstAt;
    if (!cust.lastAt || (o.created_at && o.created_at > cust.lastAt)) cust.lastAt = o.created_at || cust.lastAt;
    custMap.set(key, cust);

    const dk = dayKey(o.created_at);
    const cd = customerDaily.get(dk) ?? { date: dk, newCustomers: 0, repeatOrders: 0, total: 0 };
    cd.total += 1;
    customerDaily.set(dk, cd);
  }

  // new vs repeat per day
  for (const [dk, cd] of customerDaily) {
    for (const o of all) {
      if (dayKey(o.created_at) !== dk) continue;
      const key = (o.customer_email && o.customer_email.trim()) || String(o.customer_phone || "").trim() || o.id;
      const first = firstOrderByCustomer.get(key);
      if (first === o.created_at) cd.newCustomers += 1;
      else cd.repeatOrders += 1;
    }
  }

  // Fill daily series so charts render continuously
  const customerTrend = dayKeys.map((dk) => {
    const cd = customerDaily.get(dk);
    return { date: dk, newCustomers: cd?.newCustomers ?? 0, repeatOrders: cd?.repeatOrders ?? 0, total: cd?.total ?? 0 };
  });

  const customerStats = {
    totalCustomers: custMap.size,
    repeatCustomers: [...custMap.values()].filter((c) => c.orders >= 2).length,
    newCustomers: custMap.size - [...custMap.values()].filter((c) => c.orders >= 2).length,
    repeatRate: custMap.size > 0 ? ([...custMap.values()].filter((c) => c.orders >= 2).length / custMap.size) * 100 : 0,
    // Orders per customer distribution
    avgOrdersPerCustomer: custMap.size > 0 ? all.length / custMap.size : 0,
    topSpenders: [...custMap.values()]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15)
      .map((c) => ({
        name: c.name || c.email || c.phone || "Guest",
        email: c.email,
        phone: c.phone,
        orders: c.orders,
        spend: c.spend,
        aov: c.orders > 0 ? c.spend / c.orders : 0,
        lastAt: c.lastAt,
      })),
  };

  // ================= SALES GROWTH (period over period) =================
  // Compare current range vs previous equal-length range (delivered revenue + orders)
  const prevFrom = from ? new Date(`${from}T00:00:00`) : null;
  const prevTo = to ? new Date(`${to}T23:59:59.999`) : null;
  interface PrevRow { total?: number | null }
  let prevRevenue = 0;
  if (prevFrom && prevTo) {
    const spanMs = prevTo.getTime() - prevFrom.getTime();
    const prevEnd = new Date(prevFrom.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - spanMs);
    const { data: prevOrders } = await supabaseAdmin
      .from("orders")
      .select("total, delivered_at")
      .eq("status", "delivered")
      .gte("delivered_at", prevStart.toISOString())
      .lte("delivered_at", prevEnd.toISOString());
    prevRevenue = (prevOrders ?? []).reduce((s: number, o: PrevRow) => s + Number(o.total ?? 0), 0);
  } else {
    const { data: prevOrders } = await supabaseAdmin
      .from("orders")
      .select("total, delivered_at")
      .eq("status", "delivered")
      .lt("delivered_at", from ? `${from}T00:00:00` : new Date().toISOString());
    prevRevenue = (prevOrders ?? []).reduce((s: number, o: PrevRow) => s + Number(o.total ?? 0), 0);
  }
  const currentRevenue = summary.revenue;

  const growth = {
    prevRevenue,
    revenueChangePct: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : currentRevenue > 0 ? 100 : 0,
    revenueChangeAmount: currentRevenue - prevRevenue,
  };

  // ================= ORDER METRICS / AOV =================
  const totalOrdersAll = all.length;
  const deliveredCount = delivered.length;
  const cancelledCount = all.filter((o) => o.status === "cancelled").length;
  const aov = deliveredCount > 0 ? summary.revenue / deliveredCount : 0;
  const deliverySuccessRate = (deliveredCount + cancelledCount) > 0
    ? Math.round((deliveredCount / (deliveredCount + cancelledCount)) * 100)
    : 0;

  // Payment mix by revenue & profit
  const paymentMix = {
    cod: { count: 0, revenue: 0, profit: 0 },
    upi: { count: 0, revenue: 0, profit: 0 },
  };
  for (const o of delivered) {
    const snap = (o.address_snapshot ?? {}) as Record<string, unknown>;
    const df = Number(snap.delivery_fee ?? 0) || 0;
    let rev = 0, cost = 0;
    for (const item of o.items ?? []) {
      const pid = item.product?.id ? String(item.product.id) : "";
      const qty = Number(item.quantity ?? 1);
      const selW = item.selectedWeight ?? undefined;
      const info = productMap.get(pid);
      const basePrice = info ? info.basePrice : Number(item.product?.price ?? 0);
      const wps = info?.weightPrices ?? [];
      const bps = info?.buyingPrices ?? [];
      rev += qty * priceForWeight(basePrice, selW, wps.length ? wps : undefined);
      cost += qty * priceForWeight(bps[0]?.price || 0, selW, bps.length ? bps : undefined);
    }
    const pm = (o.payment_method ?? "cod") === "upi" ? "upi" : "cod";
    paymentMix[pm].count += 1;
    paymentMix[pm].revenue += rev;
    paymentMix[pm].profit += (rev - cost) + df;
  }

  return NextResponse.json({
    summary,
    margin,
    missingCostItems,
    daily: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    categories,
    topProducts,
    zones,
    customers: customerStats,
    customerTrend,
    growth,
    orders: {
      total: totalOrdersAll,
      delivered: deliveredCount,
      cancelled: cancelledCount,
      aov,
      deliverySuccessRate,
      avgOrderValueAll: totalOrdersAll > 0 ? all.reduce((s, o) => s + Number(o.total ?? 0), 0) / totalOrdersAll : 0,
    },
    paymentMix,
    dateRange: { from, to, days },
  });
}
