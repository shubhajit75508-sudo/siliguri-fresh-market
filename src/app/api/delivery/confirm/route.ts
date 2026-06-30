import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { orderId, code } = await req.json();

  if (!orderId || !code) {
    return NextResponse.json({ error: "Missing orderId or code" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("delivery_code, payment_status, payment_method")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.delivery_code !== code) {
    return NextResponse.json({ error: "Invalid delivery code" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    delivery_status: "delivered",
    status: "delivered",
  };

  if (order.payment_method === "cod" && order.payment_status !== "paid") {
    updates.payment_status = "paid";
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (updateError) {
    console.error("confirm update error:", updateError.code);
    return NextResponse.json({ error: "Failed to confirm delivery" }, { status: 500 });
  }

  return NextResponse.json({ success: true, paymentUpdated: updates.payment_status === "paid" });
}
