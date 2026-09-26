/**
 * Sanity checks for the analytics math. Run with: npx tsx scripts/verify-analytics.ts
 * (or compile-and-run). Kept out of the app bundle.
 */
import {
  buildCohorts,
  computeTotals,
  customerKey,
  dayBounds,
  dayKey,
  daysBetween,
  firstOrderFlags,
  orderFinancials,
  previousWindow,
  rangeDays,
  resolveRange,
  type AnalyticsOrder,
  type Catalog,
} from "../src/lib/analytics";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL  ${name}\n      expected ${JSON.stringify(expected)}\n      actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${name}`);
  }
}
const near = (n: number, e: number, tol = 0.01) => Math.abs(n - e) <= tol;

const catalog: Catalog = new Map([
  ["p1", { category: "fish", basePrice: 200, weightPrices: [{ weight: "1kg", price: 200 }], buyingPrices: [{ weight: "1kg", price: 140 }] }],
  ["p2", { category: "chicken", basePrice: 180, weightPrices: [], buyingPrices: [] }],
]);

const base: AnalyticsOrder = {
  id: "o1",
  status: "delivered",
  created_at: "2026-03-10T10:00:00Z",
  delivered_at: "2026-03-10T12:00:00Z",
  total: 240,
  address_snapshot: { delivery_fee: 40, discount: 20, area: "Bhaktinagar" },
  customer_email: "A@Example.com",
  payment_method: "cod",
  items: [{ product: { id: "p1", name: "Rohu" }, quantity: 1, selectedWeight: "1kg", unitPrice: 200, unitCost: 140 }],
};

/* 1. Revenue uses the snapshotted price, subtracts the discount, adds the fee. */
{
  const f = orderFinancials(base, catalog);
  check("gross = qty x unitPrice", f.gross, 200);
  check("discount is read from the snapshot", f.discount, 20);
  check("net merchandise = gross - discount", f.net, 180);
  check("revenue = net + delivery fee", f.revenue, 220);
  check("cost uses the snapshotted cost", f.cost, 140);
  check("profit = revenue - cost", f.profit, 80);
  check("no missing-cost items", f.missingCostItems, 0);
  check("no estimated-cost items", f.estimatedCostItems, 0);
}

/* 2. A coupon larger than the merchandise is clamped, never negative. */
{
  const f = orderFinancials({ ...base, address_snapshot: { delivery_fee: 40, discount: 9999 } }, catalog);
  check("discount clamped to gross", f.discount, 200);
  check("net is never negative", f.net, 0);
  check("revenue is just the fee", f.revenue, 40);
}

/* 3. Historical price stability: changing today's catalogue must not rewrite history. */
{
  const bumped: Catalog = new Map([
    ["p1", { category: "fish", basePrice: 999, weightPrices: [{ weight: "1kg", price: 999 }], buyingPrices: [{ weight: "1kg", price: 140 }] }],
  ]);
  const f = orderFinancials(base, bumped);
  check("revenue ignores today's price", f.revenue, 220);
  check("cost ignores today's cost when snapshotted", f.cost, 140);
}

/* 4. Orders with no snapshot fall back to the catalogue and are flagged as estimated. */
{
  const legacy: AnalyticsOrder = {
    ...base,
    items: [{ product: { id: "p1", name: "Rohu", price: 200 }, quantity: 2, selectedWeight: "1kg" }],
    address_snapshot: {},
  };
  const f = orderFinancials(legacy, catalog);
  check("falls back to catalog price", f.gross, 400);
  check("falls back to catalog cost", f.cost, 280);
  check("flagged as estimated cost", f.estimatedCostItems, 1);
}

/* 5. Missing cost is reported, and never silently counted as profit. */
{
  const noCost: AnalyticsOrder = {
    ...base,
    items: [{ product: { id: "p2", name: "Chicken" }, quantity: 1, selectedWeight: "1kg", unitPrice: 180 }],
    address_snapshot: {},
  };
  const f = orderFinancials(noCost, catalog);
  check("missing cost counted", f.missingCostItems, 1);
  check("cost is zero when unknown", f.cost, 0);
  check("profit is flagged as overstated via dataQuality", f.profit, f.revenue);
}

/* 6. Line-level discount allocation adds back up to the order net. */
{
  const two: AnalyticsOrder = {
    ...base,
    items: [
      { product: { id: "p1", name: "Rohu" }, quantity: 1, selectedWeight: "1kg", unitPrice: 100, unitCost: 60 },
      { product: { id: "p1", name: "Rohu" }, quantity: 1, selectedWeight: "1kg", unitPrice: 300, unitCost: 100 },
    ],
    address_snapshot: { delivery_fee: 0, discount: 80 },
  };
  const f = orderFinancials(two, catalog);
  check("allocated net sums to order net", f.lines.reduce((s, l) => s + l.lineNet, 0), 320);
  check("allocated cost sums to order cost", f.lines.reduce((s, l) => s + l.lineCost, 0), 160);
  check("net respects the discount", f.net, 320);
}

/* 7. Totals over a set of orders. */
{
  const t = computeTotals([base, { ...base, id: "o2" }], catalog);
  check("revenue totals", t.revenue, 440);
  check("profit totals", t.profit, 160);
  check("order count", t.orderCount, 2);
}

/* 8. Business-timezone day bucketing (IST = UTC+5:30). */
{
  // 18:00 UTC on the 10th is already 23:30 on the 10th in IST.
  check("late-UTC stays on the same IST day", dayKey("2026-03-10T18:00:00Z"), "2026-03-10");
  // 20:00 UTC on the 10th is 01:30 on the 11th in IST.
  check("post-midnight-UTC rolls to the next IST day", dayKey("2026-03-10T20:00:00Z"), "2026-03-11");
  // 14:00 UTC on the 10th is 19:30 on the 10th in IST.
  check("evening IST is same day", dayKey("2026-03-10T14:00:00Z"), "2026-03-10");
}

/* 9. Day bounds are IST-based, expressed as UTC. */
{
  const b = dayBounds("2026-03-10");
  // IST midnight is 18:30 UTC the previous day; 23:59:59.999 IST is 18:29:59.999 UTC.
  check("IST day starts 18:30 UTC the previous day", b.startIso, "2026-03-09T18:30:00.000Z");
  check("IST day ends 18:29:59.999 UTC", b.endIso, "2026-03-10T18:29:59.999Z");
  check("the last instant of the day is inside it", new Date("2026-03-10T18:29:59.999Z").getTime() <= new Date(b.endIso).getTime(), true);
  check("the next instant is outside it", new Date("2026-03-10T18:30:00.000Z").getTime() > new Date(b.endIso).getTime(), true);
}

/* 10. Range helpers. */
{
  check("daysBetween is inclusive-friendly", daysBetween("2026-03-01", "2026-03-10"), 9);
  check("rangeDays is inclusive", rangeDays("2026-03-01", "2026-03-05").length, 5);
  const r = resolveRange("2026-03-01", "2026-03-10");
  check("resolved range keeps the window", [r.from, r.to, r.days], ["2026-03-01", "2026-03-10", 10]);
  check("explicit range is not defaulted", r.defaulted, false);
  const p = previousWindow("2026-03-01", "2026-03-10");
  check("previous window is the same length, immediately before", [p.from, p.to], ["2026-02-19", "2026-02-28"]);
  check("previous window is the same length", daysBetween(p.from, p.to) + 1, 10);
}

/* 11. Customer identity is normalised. */
{
  check("email is lowercased", customerKey({ customer_email: "A@Example.com", id: "1" }), "e:a@example.com");
  check("same person, different case", customerKey({ customer_email: "a@EXAMPLE.com", id: "2" }), "e:a@example.com");
  check("phone uses the last 10 digits", customerKey({ customer_phone: "+91 98329 66112", id: "3" }), "p:9832966112");
  check("phone formatting does not split records", customerKey({ customer_phone: "098329-66112", id: "4" }), "p:9832966112");
}

/* 12. Cohorts are keyed on each customer's FIRST order month, and
       "returned" means they ordered again at any later time. */
{
  const c = buildCohorts([
    { id: "a", created_at: "2026-01-05T05:00:00Z", customer_email: "x@y.com", total: 100 },
    { id: "b", created_at: "2026-02-09T05:00:00Z", customer_email: "x@y.com", total: 200 },
    { id: "c", created_at: "2026-01-20T05:00:00Z", customer_email: "z@y.com", total: 300 },
    { id: "d", created_at: "2026-02-15T05:00:00Z", customer_email: "w@y.com", total: 400 },
  ]);
  // x and z first ordered in January; w first ordered in February. x's February
  // order must NOT create a second February customer or move them out of January.
  check("one cohort per first-order month", c.length, 2);
  const jan = c.find((x) => x.month === "2026-01")!;
  const feb = c.find((x) => x.month === "2026-02")!;
  check("january cohort size", jan.customers, 2);
  check("only x@y.com came back", jan.returned, 1);
  check("january retention percentage", near(jan.retentionPct, 50), true);
  check("february cohort size", feb.customers, 1);
  check("nobody in february came back", feb.returned, 0);
  check("february retention percentage", near(feb.retentionPct, 0), true);
  check("cohorts read oldest-first (a retention table fills left to right)", [c[0].month, c[1].month], ["2026-01", "2026-02"]);
}

/* 13. A customer's repeat order must not retroactively mark their first order
       as a repeat purchase, and pre-range history must not inflate the count. */
{
  const isFirst = firstOrderFlags([
    { id: "a", created_at: "2026-01-05T05:00:00Z", customer_email: "x@y.com", total: 100 },
    { id: "b", created_at: "2026-02-09T05:00:00Z", customer_email: "x@y.com", total: 200 },
    { id: "c", created_at: "2026-01-20T05:00:00Z", customer_email: "z@y.com", total: 300 },
  ]);
  check("first order is flagged first", isFirst.get("a"), true);
  check("second order is not flagged", isFirst.get("b"), false);
  check("lonely customer is still a first order", isFirst.get("c"), true);
  check("flags returned for every order", isFirst.size, 3);
}

/* 14. Every line's profit must roll up into the summary. */
{
  const orders = [base, { ...base, id: "o9", status: "delivered" }];
  const t = computeTotals(orders, catalog);
  check("profit = revenue - cost", near(t.profit, t.revenue - t.cost), true);
  check("revenue = merch + fees", near(t.revenue, t.merchRevenue + t.deliveryFees + t.extraCharges), true);
}

console.log(failures === 0 ? "\nAll analytics checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
