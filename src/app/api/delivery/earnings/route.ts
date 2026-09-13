import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId, getRole } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const payload = await getSession(req);
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (getRole(payload) !== "delivery") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const userId = getUserId(payload);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const day = (weekStart.getDay() + 6) % 7; // Monday = 0
  weekStart.setDate(weekStart.getDate() - day);

  const [allRes, weekRes] = await Promise.all([
    supabaseAdmin
      .from("delivery_earnings")
      .select("id, order_id, amount, created_at")
      .eq("delivery_boy_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("delivery_earnings")
      .select("amount")
      .eq("delivery_boy_id", userId)
      .gte("created_at", weekStart.toISOString()),
  ]);

  const all = allRes.data ?? [];
  const week = weekRes.data ?? [];
  const total = all.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const weekTotal = week.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  // How much money the delivery partner actually collected from customers
  // (cash + UPI at the door) on their delivered orders.
  const { data: ordersData } = await supabaseAdmin
    .from("orders")
    .select("total, payment_method, address_snapshot, delivered_at")
    .eq("delivery_boy_id", userId)
    .eq("status", "delivered");

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const collectedOf = (o: Record<string, unknown>) => {
    const pc = (o.address_snapshot as Record<string, unknown> | null)?.payment_collected as { amount?: number } | undefined;
    if (pc && typeof pc.amount === "number") return pc.amount;
    return o.payment_method === "cod" ? Number(o.total ?? 0) : 0;
  };
  const methodOf = (o: Record<string, unknown>) => {
    const pc = (o.address_snapshot as Record<string, unknown> | null)?.payment_collected as { method?: string } | undefined;
    return pc?.method ?? (o.payment_method === "cod" ? "cash" : "upi");
  };
  const collectedTotal = orders.reduce((sum, o) => sum + collectedOf(o), 0);
  const cashCollected = orders
    .filter((o) => methodOf(o) === "cash")
    .reduce((sum, o) => sum + collectedOf(o), 0);
  const upiCollected = orders
    .filter((o) => methodOf(o) === "upi")
    .reduce((sum, o) => sum + collectedOf(o), 0);

  return NextResponse.json({
    total,
    deliveries: all.length,
    weekTotal,
    weekDeliveries: week.length,
    recent: all.slice(0, 20),
    collectedTotal,
    cashCollected,
    upiCollected,
  });
}
