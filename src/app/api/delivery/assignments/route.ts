import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  // Require authenticated session (delivery boy or admin)
  const payload = await getSession(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const boyId = searchParams.get("boy_id");

  if (!boyId) {
    return NextResponse.json({ error: "Missing boy_id param" }, { status: 400 });
  }

  // Verify caller is the delivery boy or an admin
  const isAdmin = payload.endsWith("|admin");
  const userId = payload.split("|")[0];
  if (!isAdmin && userId !== boyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: ordersData, error } = await supabaseAdmin
    .from("orders")
    .select("id, customer_name, customer_phone, total, items, payment_status, delivery_status, address_snapshot, created_at, delivery_boy_id")
    .eq("delivery_boy_id", boyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
  }

  const assignments = (ordersData ?? []).map((o: Record<string, unknown>) => ({
    id: o.id as string,
    orderId: o.id as string,
    deliveryBoyId: o.delivery_boy_id as string,
    customerName: o.customer_name as string,
    customerPhone: o.customer_phone as string,
    paymentStatus: (o.payment_status as "paid" | "unpaid") ?? "unpaid",
    address: (o.address_snapshot as Record<string, unknown>) ?? {},
    items: (o.items as { name: string; quantity: number }[]) ?? [],
    total: o.total as number,
    status: (o.delivery_status as string) === "picked_up" ? "picked_up" as const : (o.delivery_status as string) === "delivered" ? "delivered" as const : (o.delivery_status as string) === "accepted" ? "accepted" as const : "assigned" as const,
    assignedAt: o.created_at as string,
    // delivery_code intentionally excluded — visible only to customer
  }));

  return NextResponse.json({ assignments });
}
