import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const day = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - day);

  const { data: all } = await supabaseAdmin
    .from("delivery_earnings")
    .select("id, delivery_boy_id, order_id, amount, order_total, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: week } = await supabaseAdmin
    .from("delivery_earnings")
    .select("amount")
    .gte("created_at", weekStart.toISOString());

  const rows = all ?? [];
  const boyIds = Array.from(new Set(rows.map((r) => r.delivery_boy_id).filter(Boolean))) as string[];
  const boyNames: Record<string, string> = {};

  if (boyIds.length) {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .in("id", boyIds);
    for (const u of users ?? []) boyNames[u.id] = u.name || u.email || "Delivery Boy";
  }

  const byBoy: Record<string, { boyId: string; name: string; total: number; count: number }> = {};
  for (const r of rows) {
    const boyId = r.delivery_boy_id as string;
    byBoy[boyId] = byBoy[boyId] ?? { boyId, name: boyNames[boyId] ?? "Delivery Boy", total: 0, count: 0 };
    byBoy[boyId].total += Number(r.amount ?? 0);
    byBoy[boyId].count += 1;
  }

  const total = rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const weekTotal = (week ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  return NextResponse.json({
    total,
    payouts: rows.length,
    weekTotal,
    weekPayouts: (week ?? []).length,
    byBoy: Object.values(byBoy).sort((a, b) => b.total - a.total),
    recent: rows.slice(0, 20).map((r) => ({
      id: r.id,
      boyId: r.delivery_boy_id,
      boyName: boyNames[r.delivery_boy_id as string] ?? "Delivery Boy",
      orderId: r.order_id,
      amount: Number(r.amount ?? 0),
      orderTotal: Number(r.order_total ?? 0),
      createdAt: r.created_at,
    })),
  });
}
