import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const raw = cookie.value.includes(".") ? cookie.value.split(".")[0] : cookie.value;
  const [userId, role] = raw.split("|");
  if (!userId || role !== "delivery") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const boyId = searchParams.get("boy_id") || userId;

  const { data: profile } = await supabaseAdmin
    .from("delivery_boy_profiles")
    .select("area, max_active_orders")
    .eq("id", boyId)
    .single();
  const boyArea = (profile?.area as string) ?? "";
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

  if (error) return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });

  const available = (data ?? []).filter((o: Record<string, unknown>) => {
    const rejectedBy: string[] = (o.rejected_by as string[]) ?? [];
    if (rejectedBy.includes(boyId)) return false;
    if (boyArea) {
      const addrSnapshot = (o.address_snapshot as Record<string, unknown>) ?? {};
      const orderArea = (addrSnapshot.area as string) ?? "";
      if (orderArea && orderArea.toLowerCase() !== boyArea.toLowerCase()) return false;
    }
    return true;
  });

  return NextResponse.json({ orders: available, atCapacity });
}
