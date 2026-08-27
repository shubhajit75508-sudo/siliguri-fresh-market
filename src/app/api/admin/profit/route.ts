import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";

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
  address_snapshot?: Record<string, unknown> | null;
  delivered_at?: string | null;
  created_at?: string | null;
  payment_method?: string | null;
};

function parseWeightMultiplier(weight?: string | null): number {
  if (!weight) return 1;
  const trimmed = String(weight).trim().toLowerCase();
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|kg)$/);
  if (!m) return 1;
  const val = parseFloat(m[1]);
  return m[2] === "g" ? val / 1000 : val;
}

function priceForWeight(
  basePrice: number,
  weight: string | undefined,
  weightPrices?: WeightPrice[]
): number {
  if (weightPrices && Array.isArray(weightPrices) && weightPrices.length && weight) {
    const match = weightPrices.find((w) => String(w.weight).toLowerCase() === weight.toLowerCase());
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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let ordersQuery = supabaseAdmin
    .from("orders")
    .select("id, items, total, address_snapshot, delivered_at, created_at, payment_method")
    .eq("status", "delivered");

  if (from) ordersQuery = ordersQuery.gte("delivered_at", `${from}T00:00:00`);
  if (to) ordersQuery = ordersQuery.lte("delivered_at", `${to}T23:59:59.999`);

  const { data: rawOrders, error: ordersError } = await ordersQuery;
  if (ordersError) return NextResponse.json({ error: "Profit query failed" }, { status: 500 });

  const orders = (rawOrders ?? []) as unknown as OrderRow[];

  // Collect all product ids referenced in the delivered orders
  const productIds = new Set<string>();
  for (const o of orders) {
    for (const item of o.items ?? []) {
      const pid = item.product?.id;
      if (pid) productIds.add(pid);
    }
  }

  // Fetch buying/weight prices for all referenced products (limit to 300 to avoid huge queries)
  const productsMap = new Map<
    string,
    { basePrice: number; weightPrices: WeightPrice[]; buyingPrices: WeightPrice[] }
  >();
  const ids = [...productIds];
  if (ids.length) {
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, price, weight_prices, buying_prices")
        .in("id", chunk);
      for (const p of products ?? []) {
        productsMap.set(String(p.id), {
          basePrice: Number(p.price) || 0,
          weightPrices: Array.isArray(p.weight_prices) ? (p.weight_prices as WeightPrice[]) : [],
          buyingPrices: Array.isArray(p.buying_prices) ? (p.buying_prices as WeightPrice[]) : [],
        });
      }
    }
  }

  // Per-order + per-day aggregation
  const summary = {
    revenue: 0,
    cost: 0,
    profit: 0,
    deliveryFees: 0,
    orderCount: 0,
  };
  const dailyMap = new Map<string, { date: string; revenue: number; cost: number; profit: number; orderCount: number }>();
  const productAgg = new Map<string, { name: string; quantity: number; revenue: number; cost: number }>();
  const paymentAgg = { cod: { revenue: 0, profit: 0 }, upi: { revenue: 0, profit: 0 } };

  for (const o of orders) {
    let orderRevenue = 0;
    let orderCost = 0;

    for (const item of o.items ?? []) {
      const prod = item.product;
      const pid = prod?.id ? String(prod.id) : "";
      const qty = Number(item.quantity ?? 1);
      const selectedWeight = item.selectedWeight ?? undefined;

      const info = productsMap.get(pid);
      const basePrice = info ? info.basePrice : Number(prod?.price ?? 0);
      const weightPrices = info?.weightPrices ?? [];
      const buyingPrices = info?.buyingPrices ?? [];

      const sellUnit = priceForWeight(basePrice, selectedWeight, weightPrices.length ? weightPrices : undefined);
      const buyUnit = priceForWeight(
        buyingPrices[0]?.price || 0,
        selectedWeight,
        buyingPrices.length ? buyingPrices : undefined
      );

      const itemRevenue = qty * sellUnit;
      const itemCost = qty * buyUnit;
      orderRevenue += itemRevenue;
      orderCost += itemCost;

      const name = prod?.name || "Item";
      const cur = productAgg.get(name) ?? { name, quantity: 0, revenue: 0, cost: 0 };
      cur.quantity += qty;
      cur.revenue += itemRevenue;
      cur.cost += itemCost;
      productAgg.set(name, cur);
    }

    // Delivery fee counts as pure profit (revenue earned with no product cost)
    const snap = (o.address_snapshot ?? {}) as Record<string, unknown>;
    const deliveryFee = Number(snap.delivery_fee ?? 0) || 0;
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

    const pm = (o.payment_method ?? "cod") === "upi" ? "upi" : "cod";
    paymentAgg[pm].revenue += orderRevenue;
    paymentAgg[pm].profit += orderProfit;
  }

  const daily = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const topProducts = [...productAgg.values()]
    .map((p) => ({ ...p, profit: p.revenue - p.cost }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 20);

  const margin = summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0;

  return NextResponse.json({
    summary: {
      ...summary,
      margin,
    },
    daily,
    topProducts,
    paymentMix: paymentAgg,
    dateRange: { from, to },
  });
}
