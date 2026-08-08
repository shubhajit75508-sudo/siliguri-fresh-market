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

  return NextResponse.json({
    total,
    deliveries: all.length,
    weekTotal,
    weekDeliveries: week.length,
    recent: all.slice(0, 20),
  });
}
