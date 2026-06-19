import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
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
    supabase.from("orders").select("total, status"),
  ]);

  const totalOrders = ordersRes.count ?? 0;
  const pendingOrders = pendingRes.count ?? 0;
  const activeDeliveries = activeRes.count ?? 0;
  const totalProducts = productsRes.count ?? 0;
  const totalCustomers = customersRes.count ?? 0;

  const allOrders = revenueRes.data ?? [];
  const totalRevenue = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const todayOrders = todayRes.data ?? [];
  const revenueToday = todayOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const ordersToday = todayOrders.length;

  const statusCounts: Record<string, number> = {};
  for (const o of allOrders) {
    const s = o.status ?? "unknown";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

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
  });
}
