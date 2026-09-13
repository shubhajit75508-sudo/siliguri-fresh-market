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

/**
 * POST /api/delivery/complete
 * Delivery boy closes a delivery at the customer's door by recording how
 * payment was collected — cash or UPI (via the in-app QR).
 * Marks the order delivered + paid, credits boy earnings and notifies the merchant.
 */
export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const payload = await getSession(req);
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const role = getRole(payload);
  const userId = getUserId(payload);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (role !== "delivery" && role !== "admin" && role !== "manager") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { orderId, method, amount, ref } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }
  if (method !== "cash" && method !== "upi") {
    return NextResponse.json({ error: "method must be 'cash' or 'upi'" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("id, total, payment_method, payment_status, delivery_boy_id, user_id, customer_name, status, delivery_status, address_snapshot")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Delivery boys can only close their own assigned orders; staff act on any order.
  if (role === "delivery" && order.delivery_boy_id !== userId) {
    return NextResponse.json({ error: "Order not assigned to you" }, { status: 403 });
  }

  if (order.status === "delivered" || order.delivery_status === "delivered") {
    return NextResponse.json({ error: "Order already delivered" }, { status: 409 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Order was cancelled" }, { status: 409 });
  }

  const total = Number(order.total ?? 0);
  if (amount > total + 0.01) {
    return NextResponse.json({ error: "Collected amount cannot exceed the order total" }, { status: 400 });
  }

  const snapshot = ((order.address_snapshot as Record<string, unknown>) ?? {}) as Record<string, unknown>;

  const updates: Record<string, unknown> = {
    delivery_status: "delivered",
    status: "delivered",
    delivered_at: new Date().toISOString(),
    payment_status: "paid",
    address_snapshot: {
      ...snapshot,
      payment_collected: {
        method,
        amount: Math.round(amount * 100) / 100,
        ref: ref ?? null,
        at: new Date().toISOString(),
      },
    },
  };

  const { error: updateError } = await supabaseAdmin.from("orders").update(updates).eq("id", orderId);

  if (updateError) {
    console.error("delivery complete update error:", updateError.code, updateError.message);
    return NextResponse.json({ error: "Failed to complete delivery" }, { status: 500 });
  }

  // Credit the delivery boy's earnings ledger (idempotent via unique order_id)
  try {
    const commission = Number(process.env.DELIVERY_COMMISSION ?? 40) || 40;
    const { error: earnError } = await supabaseAdmin.from("delivery_earnings").upsert(
      {
        delivery_boy_id: order.delivery_boy_id ?? userId,
        order_id: orderId,
        amount: commission,
        order_total: total,
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

  // Alert the merchant with the collection details
  try {
    const mode = method === "cash" ? "💰 Cash" : "📲 UPI";
    await sendWhatsAppAlert(
      `${mode} Collected\nOrder: ${orderId}\nAmount: ₹${amount.toFixed(2)}\nCustomer: ${order.customer_name || "—"}`
    );
  } catch (e) {
    console.error("[whatsapp] collection alert failed:", e);
  }

  return NextResponse.json({ success: true, paymentStatus: "paid" });
}