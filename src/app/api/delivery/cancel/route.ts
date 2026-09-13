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
 * POST /api/delivery/cancel
 * Delivery boy (or admin/manager) cancels a delivery before it is completed.
 * Marks the order cancelled, refunds if pre-paid, restores stock and records
 * who/why/when inside address_snapshot so it surfaces in admin.
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

  const { orderId, reason } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("id, total, items, payment_status, delivery_boy_id, user_id, customer_name, status, delivery_status, address_snapshot")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Delivery boys can only cancel their own assigned orders; staff act on any order.
  if (role === "delivery" && order.delivery_boy_id !== userId) {
    return NextResponse.json({ error: "Order not assigned to you" }, { status: 403 });
  }

  if (order.status === "delivered" || order.delivery_status === "delivered") {
    return NextResponse.json({ error: "Cannot cancel a delivered order" }, { status: 409 });
  }
  if (order.status === "cancelled" || order.delivery_status === "cancelled") {
    return NextResponse.json({ error: "Order already cancelled" }, { status: 409 });
  }

  const snapshot = ((order.address_snapshot as Record<string, unknown>) ?? {}) as Record<string, unknown>;

  const updates: Record<string, unknown> = {
    status: "cancelled",
    delivery_status: "cancelled",
    address_snapshot: {
      ...snapshot,
      cancelled_by: role === "delivery" ? "delivery_partner" : role,
      cancelled_reason: typeof reason === "string" ? reason.slice(0, 300) || null : null,
      cancelled_at: new Date().toISOString(),
    },
  };
  if (order.payment_status === "paid") updates.payment_status = "refunded";

  const { error: updateError } = await supabaseAdmin.from("orders").update(updates).eq("id", orderId);

  if (updateError) {
    console.error("delivery cancel update error:", updateError.code, updateError.message);
    return NextResponse.json({ error: "Failed to cancel delivery" }, { status: 500 });
  }

  // Restore stock so cancelled items are available again (same semantics as admin cancel).
  try {
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items as any[]) {
        const productId = item.product?.id || item.productId;
        const quantity = item.quantity || 1;
        if (productId) {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", productId)
            .maybeSingle();
          const currentStock = (product?.stock ?? 0) + quantity;
          await supabaseAdmin
            .from("products")
            .update({ stock: currentStock, in_stock: currentStock > 0 })
            .eq("id", productId);
        }
      }
    }
  } catch (e) {
    console.error("Failed to restore stock on cancel:", e);
  }

  // Notify the customer their order was cancelled (web push, best-effort)
  if (order.user_id) {
    try {
      await sendPushToUser(supabaseAdmin, order.user_id as string, {
        title: "Order cancelled",
        body: `Order ${orderId} was cancelled before delivery.`,
        url: `/track/${orderId}`,
      });
    } catch (e) {
      console.error("[push] cancelled notify failed:", e);
    }
  }

  // Alert the merchant so cancellation is surfaced immediately
  try {
    await sendWhatsAppAlert(
      `❌ Delivery Cancelled\nOrder: ${orderId}\nCustomer: ${order.customer_name || "—"}\nReason: ${typeof reason === "string" && reason ? reason : "Not specified"}`
    );
  } catch (e) {
    console.error("[whatsapp] cancel alert failed:", e);
  }

  return NextResponse.json({ success: true });
}