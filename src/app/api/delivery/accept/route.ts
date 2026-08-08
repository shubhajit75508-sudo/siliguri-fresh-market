import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId, getRole } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const payload = await getSession(req);
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (getRole(payload) !== "delivery") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const userId = getUserId(payload);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("id, payment_method, payment_status, delivery_status, status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "cancelled" || order.delivery_status !== "pending") {
    return NextResponse.json({ error: "Order already accepted or unavailable" }, { status: 409 });
  }
  if (order.payment_method === "upi" && order.payment_status !== "paid") {
    return NextResponse.json({ error: "Order not paid yet — wait for payment confirmation", code: "NOT_PAID" }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ delivery_boy_id: userId, delivery_status: "accepted" })
    .eq("id", orderId)
    .eq("delivery_status", "pending")
    .neq("status", "cancelled")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order already accepted or unavailable" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
