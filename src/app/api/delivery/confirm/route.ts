import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId, getRole } from "@/lib/api-auth";
import { sendPushToUser } from "@/lib/push";
import { sendWhatsAppAlert } from "@/lib/whatsapp";

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

  const payload = await getSession(req);
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = getRole(payload);
  const userId = getUserId(payload);
  if (!userId || (role !== "delivery" && role !== "admin")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { orderId, code } = await req.json();

  if (!orderId || !code) {
    return NextResponse.json({ error: "Missing orderId or code" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("delivery_code, payment_status, payment_method, delivery_boy_id, user_id, customer_name, total, id, address_snapshot")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // delivery_code may live in the top-level column OR inside address_snapshot
  const orderDeliveryCode = order.delivery_code
    || ((order.address_snapshot as Record<string, unknown>)?.delivery_code as string)
    || "";

  // Only the assigned delivery boy (or an admin) can confirm delivery
  if (role === "delivery" && order.delivery_boy_id !== userId) {
    return NextResponse.json({ error: "Order not assigned to you" }, { status: 403 });
  }

  if (orderDeliveryCode !== code) {
    return NextResponse.json({ error: "Invalid delivery code" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    delivery_status: "delivered",
    status: "delivered",
    delivered_at: new Date().toISOString(),
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

  // Credit the delivery boy's earnings ledger (idempotent via unique order_id)
  try {
    const commission = Number(process.env.DELIVERY_COMMISSION ?? 40) || 40;
    const { error: earnError } = await supabaseAdmin.from("delivery_earnings").upsert(
      {
        delivery_boy_id: order.delivery_boy_id ?? userId,
        order_id: orderId,
        amount: commission,
        order_total: order.total ?? 0,
      },
      { onConflict: "order_id", ignoreDuplicates: true }
    );
    if (earnError) console.error("[earnings] credit failed:", earnError.message);
  } catch (e) {
    console.error("[earnings] credit failed:", e);
  }

  // Notify the customer that delivery is complete (web push, best-effort)
  if (order.user_id) {
    try {
      await sendPushToUser(supabaseAdmin, order.user_id as string, {
        title: "Order delivered 🎉",
        body: `Order ${orderId} was delivered. Enjoy your meal!`,
        url: `/track/${orderId}`,
      });
    } catch (e) {
      console.error("[push] delivered notify failed:", e);
    }
  }

  // Alert the merchant when cash is collected at the door
  if (updates.payment_status === "paid" && order.payment_method === "cod") {
    try {
      await sendWhatsAppAlert(
        `💰 *COD Collected*\nOrder: ${orderId}\nAmount: ₹${Number(order.total ?? 0).toFixed(2)}\nCustomer: ${order.customer_name || "—"}`
      );
    } catch (e) {
      console.error("[whatsapp] COD alert failed:", e);
    }
  }

  return NextResponse.json({ success: true, paymentUpdated: updates.payment_status === "paid" });
}
