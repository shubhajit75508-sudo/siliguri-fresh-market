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
    .from("delivery_boys")
    .select("area, max_active_orders")
    .eq("id", boyId)
    .single();
  const boyArea = (profile?.area as string) ?? "";
  const maxActive = (profile?.max_active_orders as number) ?? 5;
  console.log("[available] boy profile - area:", boyArea, "max:", maxActive);

  const { count: activeCount } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("delivery_boy_id", boyId)
    .in("delivery_status", ["accepted", "picked_up"]);

  const atCapacity = (activeCount ?? 0) >= maxActive;

  // Debug: log total non-cancelled orders regardless of delivery_status
  const { count: totalNonCancelled } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .neq("status", "cancelled");
  console.log("[available] total non-cancelled orders:", totalNonCancelled);

  const { count: totalPending } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("delivery_status", "pending")
    .neq("status", "cancelled");
  console.log("[available] total pending + non-cancelled:", totalPending);

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

  console.log("[available] raw pending orders from DB:", data?.length ?? 0);
  if (data && data.length > 0) {
    console.log("[available] first order keys:", Object.keys(data[0]).join(","));
    console.log("[available] first order delivery_status:", data[0].delivery_status, "status:", data[0].status);
    data.forEach((o: Record<string, unknown>, i: number) => {
      const addr = (o.address_snapshot as Record<string, unknown>) ?? {};
      console.log("[available] order", i, "id:", o.id, "area:", addr.area, "full_address:", addr.full_address);
    });
  }

  const available = (data ?? []).filter((o: Record<string, unknown>) => {
    const rejectedBy: string[] = Array.isArray(o.rejected_by) ? (o.rejected_by as string[]) : [];
    if (rejectedBy.includes(boyId)) { console.log("[available] filtered out by rejected_by for order", o.id); return false; }
    if (boyArea) {
      const addrSnapshot = (o.address_snapshot as Record<string, unknown>) ?? {};
      const orderArea = (addrSnapshot.area as string) ?? "";
      if (orderArea && orderArea.toLowerCase() !== boyArea.toLowerCase()) { console.log("[available] filtered out by area for order", o.id, "orderArea:", orderArea, "boyArea:", boyArea); return false; }
    }
    return true;
  });
  console.log("[available] available after filters:", available.length);

  return NextResponse.json({ orders: available, atCapacity, _debug: { totalNonCancelled, totalPending, rawCount: data?.length ?? 0, boyArea } });
}
