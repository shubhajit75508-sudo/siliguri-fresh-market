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

  const { searchParams } = new URL(req.url);
  const boyId = searchParams.get("boy_id") || userId;

  const { data: profile } = await supabaseAdmin
    .from("delivery_boys")
    .select("max_active_orders")
    .eq("id", boyId)
    .single();
  const maxActive = (profile?.max_active_orders as number) ?? 5;

  const { count: activeCount } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("delivery_boy_id", boyId)
    .in("delivery_status", ["accepted", "picked_up"]);

  const atCapacity = (activeCount ?? 0) >= maxActive;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("delivery_status", "pending")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[available] query error:", error.message, error.details);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }

  const available = (data ?? []).filter((o: Record<string, unknown>) => {
    const rejectedBy: string[] = Array.isArray(o.rejected_by) ? (o.rejected_by as string[]) : [];
    if (rejectedBy.includes(boyId)) return false;
    return true;
  });

  return NextResponse.json({ orders: available, atCapacity });
}
