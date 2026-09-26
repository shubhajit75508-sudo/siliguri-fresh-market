/**
 * Canonical analytics math for admin revenue / profit reporting.
 *
 * Accounting contract (single source of truth — all admin reporting uses this):
 *
 *   grossMerchRevenue = Σ (quantity × sellUnit)     sellUnit = items[].unitPrice
 *                                                          (snapshot taken at order
 *                                                           creation — NOT today's price)
 *   discounts         = order discount actually applied (coupon)
 *   netMerchRevenue   = grossMerchRevenue − discounts
 *   deliveryFees      = fee charged to the customer   → pure shop profit
 *   extraCharges      = manual/other charges collected by the shop → shop profit
 *   revenue           = netMerchRevenue + deliveryFees + extraCharges
 *   cost              = Σ (quantity × buyUnit)      buyUnit = items[].unitCost
 *                                                          (snapshot; falls back to the
 *                                                           product's current buying price)
 *   profit            = revenue − cost
 *
 * `revenue` is therefore what the customer actually paid and reconciles with the
 * `orders.total` column, so the dashboard and the analytics page cannot disagree.
 *
 * Delivery-boy payouts are tracked separately for information only and are never
 * deducted — the customer delivery fee is shop profit.
 *
 * Cost accuracy is reported explicitly:
 *   missingCostItems  — items with no cost data at all (profit is overstated)
 *   estimatedCostItems — items whose cost came from TODAY's buying price because the
 *                        order predates cost snapshots (profit is approximate)
 */

/** Business timezone. Siliguri, India. Stored timestamps are UTC. */
export const BUSINESS_TZ = "Asia/Kolkata";
const TZ_OFFSET_MIN = 330; // +05:30

export type WeightPrice = { weight: string; price: number };

/** A product as it exists in the `products` table right now. */
export type CatalogEntry = {
  category: string;
  basePrice: number;
  weightPrices: WeightPrice[];
  buyingPrices: WeightPrice[];
};

export type AnalyticsOrderItem = {
  product?: { id?: string; name?: string; price?: number; weightPrices?: WeightPrice[] } | null;
  quantity?: number | null;
  selectedWeight?: string | null;
  /** Sell price per unit captured when the order was created. Authoritative for revenue. */
  unitPrice?: number | null;
  /** Cost price per unit captured when the order was created. Authoritative for cost. */
  unitCost?: number | null;
};

export type AnalyticsOrder = {
  id: string;
  items?: AnalyticsOrderItem[] | null;
  total?: number | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  discount?: number | null;
  extra_charges?: number | null;
  status?: string | null;
  order_source?: string | null;
  address_snapshot?: Record<string, unknown> | null;
  delivered_at?: string | null;
  created_at?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  delivery_boy_id?: string | null;
};

export type Catalog = Map<string, CatalogEntry>;

export type LineBreakdown = {
  productId: string;
  name: string;
  category: string;
  qty: number;
  sellUnit: number;
  buyUnit: number;
  lineGross: number;
  lineNet: number;
  lineCost: number;
  /** cost came from today's buying price (no snapshot on this order) */
  estimatedCost: boolean;
  /** no cost data available at all */
  missingCost: boolean;
  /** sell price came from today's catalog (no unitPrice on this order) */
  estimatedSell: boolean;
};

export type OrderFinancials = {
  gross: number;
  discount: number;
  net: number;
  deliveryFee: number;
  extraCharges: number;
  revenue: number;
  cost: number;
  profit: number;
  lines: LineBreakdown[];
  missingCostItems: number;
  estimatedCostItems: number;
  itemsSold: number;
};

export type PeriodTotals = {
  revenue: number;
  merchRevenue: number;
  cost: number;
  profit: number;
  deliveryFees: number;
  discounts: number;
  extraCharges: number;
  orderCount: number;
  itemsSold: number;
  missingCostItems: number;
  estimatedCostItems: number;
};

// ────────────────────────────── primitives ──────────────────────────────

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function parseWeightMultiplier(weight?: string | null): number {
  if (!weight) return 1;
  const w = String(weight).trim().toLowerCase().replace(/\s+/g, "");
  const m = w.match(/^(\d+(?:\.\d+)?)(g|kg)$/);
  if (!m) return 1;
  const val = parseFloat(m[1]);
  if (!Number.isFinite(val)) return 1;
  return m[2] === "g" ? val / 1000 : val;
}

function normalizeWeight(weight?: string | null): string {
  return String(weight ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

export function priceForWeight(basePrice: number, weight: string | undefined, tiers?: WeightPrice[]): number {
  if (tiers && Array.isArray(tiers) && tiers.length && weight) {
    const w = normalizeWeight(weight);
    const match = tiers.find((p) => normalizeWeight(p.weight) === w);
    if (match && Number.isFinite(Number(match.price))) return Number(match.price);
  }
  return basePrice * parseWeightMultiplier(weight);
}

/** True when a selling tier exists for this exact weight. */
function hasTier(tiers: WeightPrice[] | undefined, weight: string | undefined): boolean {
  if (!tiers || !tiers.length || !weight) return false;
  const w = normalizeWeight(weight);
  return tiers.some((p) => normalizeWeight(p.weight) === w);
}

// ───────────────────────── business-timezone date helpers ─────────────────────────

/** Shift a UTC ISO instant into business-local time so we can read its parts. */
function toBusiness(iso?: string | null): Date | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + TZ_OFFSET_MIN * 60_000);
}

/** YYYY-MM-DD in the business timezone. */
export function dayKey(iso?: string | null): string {
  const d = toBusiness(iso);
  return d ? d.toISOString().slice(0, 10) : "";
}

/** 0=Sunday … 6=Saturday, in the business timezone. */
export function dayOfWeek(iso?: string | null): number {
  const d = toBusiness(iso);
  return d ? d.getUTCDay() : -1;
}

/** 0–23, in the business timezone. */
export function hourOfDay(iso?: string | null): number {
  const d = toBusiness(iso);
  return d ? d.getUTCHours() : -1;
}

/** YYYY-MM in the business timezone. */
export function monthKey(iso?: string | null): string {
  const d = toBusiness(iso);
  return d ? d.toISOString().slice(0, 7) : "";
}

/** Today's business date as YYYY-MM-DD. */
export function businessToday(): string {
  return dayKey(new Date().toISOString());
}

/** UTC ISO bounds for a business-timezone calendar day. */
export function dayBounds(day: string): { startIso: string; endIso: string } {
  return {
    startIso: new Date(`${day}T00:00:00+05:30`).toISOString(),
    endIso: new Date(`${day}T23:59:59.999+05:30`).toISOString(),
  };
}

function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + delta * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

const MAX_SERIES_DAYS = 400;

export type ResolvedRange = {
  /** what the caller asked for (may be null = unbounded) */
  requestedFrom: string | null;
  requestedTo: string | null;
  /** concrete bounded range actually used for series generation */
  from: string;
  to: string;
  days: number;
  /** true when the caller left the range open and we defaulted it */
  defaulted: boolean;
  /** true when a bounded range was requested and is longer than the series cap */
  truncatedSeries: boolean;
};

export function resolveRange(requestedFrom: string | null, requestedTo: string | null, defaultSpan = 30): ResolvedRange {
  const to = requestedTo && /^\d{4}-\d{2}-\d{2}$/.test(requestedTo) ? requestedTo : businessToday();
  let from: string;
  let defaulted = false;
  if (requestedFrom && /^\d{4}-\d{2}-\d{2}$/.test(requestedFrom)) {
    from = requestedFrom;
  } else {
    from = addDays(to, -(defaultSpan - 1));
    defaulted = true;
  }
  if (from > to) from = to;
  const totalDays = daysBetween(from, to) + 1;
  const truncated = totalDays > MAX_SERIES_DAYS;
  const seriesFrom = truncated ? addDays(to, -(MAX_SERIES_DAYS - 1)) : from;
  return {
    requestedFrom,
    requestedTo,
    from: seriesFrom,
    to,
    days: totalDays,
    defaulted,
    truncatedSeries: truncated,
  };
}

/** Inclusive list of business dates. */
export function rangeDays(from: string, to: string): string[] {
  const n = daysBetween(from, to);
  if (!Number.isFinite(n) || n < 0) return [];
  const out: string[] = [];
  for (let i = 0; i <= n && i < MAX_SERIES_DAYS; i++) out.push(addDays(from, i));
  return out;
}

/** The equally-long window immediately before [from, to]. */
export function previousWindow(from: string, to: string): { from: string; to: string } {
  const len = daysBetween(from, to) + 1;
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

// ────────────────────────────── order math ──────────────────────────────

function snapshotNum(snap: Record<string, unknown>, key: string): unknown {
  const v = snap?.[key];
  return v === undefined || v === null || v === "" ? undefined : v;
}

/**
 * Financial breakdown for a single order.
 * Prefers values snapshotted at order time; falls back to the current catalog and
 * flags the fallback so the UI can disclose how much of the report is estimated.
 */
export function orderFinancials(order: AnalyticsOrder, catalog: Catalog): OrderFinancials {
  const snap = (order.address_snapshot ?? {}) as Record<string, unknown>;
  const items = Array.isArray(order.items) ? order.items : [];

  // The site order path stores money in address_snapshot; the manual-order path
  // writes the same values to real columns. Prefer the snapshot, fall back to columns.
  const deliveryFee = num(snapshotNum(snap, "delivery_fee") ?? order.delivery_fee);
  const extraCharges = num(snapshotNum(snap, "extra_charges") ?? order.extra_charges);
  const rawDiscount = num(snapshotNum(snap, "discount") ?? order.discount);

  type Tmp = Omit<LineBreakdown, "lineNet">;
  const tmp: Tmp[] = [];

  for (const item of items) {
    const pid = item?.product?.id ? String(item.product.id) : "";
    const name = item?.product?.name || "Item";
    const qty = num(item?.quantity) || 0;
    if (qty <= 0) continue;
    const selW = item?.selectedWeight ?? undefined;
    const entry = catalog.get(pid);

    // ── sell price: snapshot first, catalog second ──
    const snapSell = num(item?.unitPrice);
    let sellUnit: number;
    let estimatedSell: boolean;
    if (snapSell > 0) {
      sellUnit = snapSell;
      estimatedSell = false;
    } else {
      const base = entry ? entry.basePrice : num(item?.product?.price);
      const tiers = entry?.weightPrices?.length ? entry.weightPrices : item?.product?.weightPrices;
      sellUnit = priceForWeight(base, selW, tiers && tiers.length ? tiers : undefined);
      estimatedSell = true;
    }

    // ── cost price: snapshot first, catalog second ──
    const snapCost = num(item?.unitCost);
    let buyUnit: number;
    let estimatedCost: boolean;
    let missingCost: boolean;
    if (snapCost > 0) {
      buyUnit = snapCost;
      estimatedCost = false;
      missingCost = false;
    } else {
      const bps = entry?.buyingPrices ?? [];
      if (!bps.length) {
        buyUnit = 0;
        missingCost = true;
        estimatedCost = false;
      } else if (hasTier(bps, selW)) {
        buyUnit = priceForWeight(0, selW, bps);
        missingCost = false;
        estimatedCost = true;
      } else {
        // No tier for this weight: scale the cheapest tier by the weight ratio so the
        // cost estimate is in the right ballpark instead of silently using tier #1.
        const cheapest = bps.reduce((m, p) => (num(p.price) < num(m.price) ? p : m), bps[0]);
        const refWeight = parseWeightMultiplier(cheapest?.weight) || 1;
        const wantWeight = parseWeightMultiplier(selW) || 1;
        const scale = refWeight > 0 ? wantWeight / refWeight : 1;
        buyUnit = num(cheapest?.price) * scale;
        missingCost = false;
        estimatedCost = true;
      }
    }

    const lineGross = qty * sellUnit;
    tmp.push({
      productId: pid,
      name,
      category: entry?.category || "other",
      qty,
      sellUnit,
      buyUnit,
      lineGross,
      lineCost: qty * buyUnit,
      estimatedCost,
      missingCost,
      estimatedSell,
    });
  }

  const gross = tmp.reduce((s, l) => s + l.lineGross, 0);
  // A discount can never exceed the merchandise it discounts.
  const discount = Math.max(0, Math.min(rawDiscount, gross));
  // Spread the discount across lines in proportion to their gross value so
  // per-category and per-product revenue add back up to the order total.
  const discountRate = gross > 0 ? discount / gross : 0;

  const lines: LineBreakdown[] = tmp.map((l) => ({
    ...l,
    lineNet: l.lineGross * (1 - discountRate),
  }));

  const net = gross - discount;
  const cost = lines.reduce((s, l) => s + l.lineCost, 0);
  const revenue = net + deliveryFee + extraCharges;

  return {
    gross,
    discount,
    net,
    deliveryFee,
    extraCharges,
    revenue,
    cost,
    profit: revenue - cost,
    lines,
    missingCostItems: lines.filter((l) => l.missingCost).length,
    estimatedCostItems: lines.filter((l) => l.estimatedCost).length,
    itemsSold: lines.reduce((s, l) => s + l.qty, 0),
  };
}

/** Totals only — used for period-over-period comparison so both windows use one formula. */
export function computeTotals(orders: AnalyticsOrder[], catalog: Catalog): PeriodTotals {
  const t: PeriodTotals = {
    revenue: 0,
    merchRevenue: 0,
    cost: 0,
    profit: 0,
    deliveryFees: 0,
    discounts: 0,
    extraCharges: 0,
    orderCount: 0,
    itemsSold: 0,
    missingCostItems: 0,
    estimatedCostItems: 0,
  };
  for (const o of orders) {
    const f = orderFinancials(o, catalog);
    t.revenue += f.revenue;
    t.merchRevenue += f.net;
    t.cost += f.cost;
    t.profit += f.profit;
    t.deliveryFees += f.deliveryFee;
    t.discounts += f.discount;
    t.extraCharges += f.extraCharges;
    t.orderCount += 1;
    t.itemsSold += f.itemsSold;
    t.missingCostItems += f.missingCostItems;
    t.estimatedCostItems += f.estimatedCostItems;
  }
  return t;
}

// ────────────────────────────── customer identity ──────────────────────────────

/**
 * Stable per-customer key. Email is lowercased and phone is reduced to its last
 * 10 digits so the same person is not split across records by formatting.
 */
export function customerKey(o: Pick<AnalyticsOrder, "customer_email" | "customer_phone" | "id">): string {
  const email = (o.customer_email ?? "").trim().toLowerCase();
  if (email) return `e:${email}`;
  const phone = (o.customer_phone ?? "").replace(/\D/g, "");
  if (phone.length >= 10) return `p:${phone.slice(-10)}`;
  return `o:${o.id}`;
}

export type CustomerSummary = {
  key: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spend: number;
  aov: number;
  firstAt: string;
  lastAt: string;
  repeat: boolean;
};

/** Groups orders into lifetime customer records. */
export function aggregateCustomers(orders: AnalyticsOrder[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of orders) {
    const key = customerKey(o);
    const created = o.created_at ?? "";
    const c = map.get(key) ?? {
      key,
      name: "",
      email: o.customer_email ?? "",
      phone: o.customer_phone ?? "",
      orders: 0,
      spend: 0,
      aov: 0,
      firstAt: created,
      lastAt: created,
      repeat: false,
    };
    c.orders += 1;
    c.spend += num(o.total);
    if (o.customer_name && !c.name) c.name = o.customer_name;
    if (!c.email && o.customer_email) c.email = o.customer_email;
    if (!c.phone && o.customer_phone) c.phone = o.customer_phone;
    if (created && (!c.firstAt || created < c.firstAt)) c.firstAt = created;
    if (created && (!c.lastAt || created > c.lastAt)) c.lastAt = created;
    map.set(key, c);
  }
  const out = [...map.values()];
  for (const c of out) {
    c.repeat = c.orders >= 2;
    c.aov = c.orders > 0 ? c.spend / c.orders : 0;
  }
  return out;
}

/**
 * Marks which of the supplied orders are each customer's FIRST order ever.
 *
 * This must be fed LIFETIME history, not just the selected range: otherwise a
 * customer who first ordered months ago looks brand new in every report that only
 * sees a short window, and their first in-range order is mislabelled as a repeat.
 */
export function firstOrderFlags(lifetimeOrders: AnalyticsOrder[]): Map<string, boolean> {
  const firstByCustomer = new Map<string, { at: string; id: string }>();
  for (const o of lifetimeOrders) {
    const key = customerKey(o);
    const at = o.created_at ?? "";
    const seen = firstByCustomer.get(key);
    if (!seen) {
      firstByCustomer.set(key, { at, id: o.id });
      continue;
    }
    // Ties (same timestamp) break on id so the result is deterministic.
    if (at && (seen.at === "" || at < seen.at)) firstByCustomer.set(key, { at, id: o.id });
    else if (at === seen.at && o.id < seen.id) firstByCustomer.set(key, { at, id: o.id });
  }
  const firstIds = new Set([...firstByCustomer.values()].map((v) => v.id));
  return new Map(lifetimeOrders.map((o) => [o.id, firstIds.has(o.id)]));
}

// ────────────────────────────── cohort retention ──────────────────────────────

export type Cohort = {
  month: string;
  customers: number;
  returned: number;
  retentionPct: number;
  revenue: number;
};

/**
 * Retention by first-order month, measured over the customer's LIFETIME order
 * history (not the selected range) so a customer who ordered before the range is
 * still counted as a returning one inside it.
 */
export function buildCohorts(lifetimeOrders: AnalyticsOrder[]): Cohort[] {
  const byCustomer = new Map<string, string[]>();
  const revenueByCustomer = new Map<string, number>();
  for (const o of lifetimeOrders) {
    const key = customerKey(o);
    const mk = monthKey(o.created_at);
    if (!mk) continue;
    const list = byCustomer.get(key);
    if (list) list.push(mk);
    else byCustomer.set(key, [mk]);
    revenueByCustomer.set(key, (revenueByCustomer.get(key) ?? 0) + num(o.total));
  }

  const buckets = new Map<string, Cohort>();
  for (const [key, months] of byCustomer) {
    const sorted = [...months].sort();
    const cohortMonth = sorted[0];
    if (!cohortMonth) continue;
    const b = buckets.get(cohortMonth) ?? { month: cohortMonth, customers: 0, returned: 0, retentionPct: 0, revenue: 0 };
    b.customers += 1;
    if (new Set(sorted).size > 1) b.returned += 1;
    b.revenue += revenueByCustomer.get(key) ?? 0;
    buckets.set(cohortMonth, b);
  }
  return [...buckets.values()]
    .map((b) => ({ ...b, retentionPct: b.customers > 0 ? (b.returned / b.customers) * 100 : 0 }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
}

// ────────────────────────────── formatting ──────────────────────────────

export function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
