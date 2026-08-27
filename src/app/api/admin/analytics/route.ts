import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";

type OrderItem = {
  product?: { name: string; price: number } | null;
  quantity?: number;
};

type OrderRow = {
  total?: number | null;
  status?: string | null;
  created_at: string;
  items?: OrderItem[] | null;
  payment_method?: string | null;
};

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const supabase = createClient(url, key);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [ordersRes, todayRes, pendingRes, activeRes, productsRes, customersRes, revenueRes] = await Promise.all([
    supabase.from("orders").select("total, status, created_at", { count: "exact", head: false }),
    supabase.from("orders").select("total, status").gte("created_at", todayStart.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: false }).eq("status", "received"),
    supabase.from("orders").select("id", { count: "exact", head: false }).in("delivery_status", ["assigned", "accepted", "picked_up"]),
    supabase.from("products").select("id", { count: "exact", head: false }),
    supabase.from("users").select("id", { count: "exact", head: false }).eq("role", "customer"),
    supabase.from("orders").select("total, status, created_at, items, payment_method"),
  ]);

  const totalOrders = ordersRes.count ?? 0;
  const pendingOrders = pendingRes.count ?? 0;
  const activeDeliveries = activeRes.count ?? 0;
  const totalProducts = productsRes.count ?? 0;
  const totalCustomers = customersRes.count ?? 0;

  const allOrders = (revenueRes.data ?? []) as OrderRow[];
  const totalRevenue = allOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const todayOrders = todayRes.data ?? [];
  const revenueToday = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const ordersToday = todayOrders.length;

  const deliveredRevenue = allOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const cancelledRevenue = allOrders
    .filter((o) => o.status === "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const pendingRevenue = allOrders
    .filter((o) => o.status === "received")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const statusCounts: Record<string, number> = {};
  for (const o of allOrders) {
    const s = o.status ?? "unknown";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  const dailyRevenue: { date: string; revenue: number; orderCount: number }[] = [];
  const days = 30;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const dayOrders = allOrders.filter((o) => {
      const ot = new Date(o.created_at).getTime();
      return ot >= start.getTime() && ot <= end.getTime() && o.status === "delivered";
    });
    dailyRevenue.push({
      date: d.toISOString().slice(0, 10),
      revenue: dayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0),
      orderCount: dayOrders.length,
    });
  }

  // Top products — aggregate item quantities/revenue across all orders
  const productAgg: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const o of allOrders) {
    if (o.status !== "delivered") continue;
    for (const item of o.items ?? []) {
      const name = item.product?.name ?? "Item";
      const qty = Number(item.quantity ?? 1);
      const price = Number(item.product?.price ?? 0);
      productAgg[name] = productAgg[name] ?? { name, quantity: 0, revenue: 0 };
      productAgg[name].quantity += qty;
      productAgg[name].revenue += qty * price;
    }
  }
  const topProducts = Object.values(productAgg)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Orders by hour of day (0-23)
  const ordersByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: allOrders.filter((o) => new Date(o.created_at).getHours() === hour).length,
  }));

  // Delivery success rate + payment mix
  const deliveredCount = allOrders.filter((o) => o.status === "delivered").length;
  const cancelledCount = allOrders.filter((o) => o.status === "cancelled").length;
  const completed = deliveredCount + cancelledCount;
  const deliverySuccessRate = completed > 0 ? Math.round((deliveredCount / completed) * 100) : 0;

  const paymentMix = {
    cod: allOrders.filter((o) => (o.payment_method ?? "cod") === "cod").length,
    upi: allOrders.filter((o) => o.payment_method === "upi").length,
  };

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    ordersToday,
    revenueToday,
    pendingOrders,
    activeDeliveries,
    totalProducts,
    totalCustomers,
    statusCounts,
    deliveredRevenue,
    cancelledRevenue,
    pendingRevenue,
    dailyRevenue,
    topProducts,
    ordersByHour,
    deliverySuccessRate,
    paymentMix,
  });
}
