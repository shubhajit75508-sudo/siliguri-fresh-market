import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const AMOUNT_TOLERANCE = 1;

// POST /api/payments/auto-confirm
// Called by the merchant's Tasker/MacroDroid automation when the bank credit
// SMS for a UPI payment arrives. Guarded by PAYMENT_AUTO_CONFIRM_SECRET —
// the same secret lives in the Tasker profile, so it must be kept private.
export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_AUTO_CONFIRM_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Auto-confirm not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdmin();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  const amount = Number(body.amount);

  // Primary path: order_id extracted from the SMS note "Order SFM-XXXX".
  if (orderId) {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, already_paid: true });
    }

    if (Number.isFinite(amount) && Math.abs(Number(order.total) - amount) > AMOUNT_TOLERANCE) {
      return NextResponse.json(
        { error: `Amount mismatch — SMS said ${amount}, order total is ${order.total}.` },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId)
      .eq("payment_status", "unpaid");

    if (updateError) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ success: true, order_id: orderId });
  }

  // Fallback path: no order_id (SMS may not include the note) — match by amount
  // against the most recent unresolved UPI order.
  if (Number.isFinite(amount)) {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_method", "upi")
      .eq("payment_status", "unpaid")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });

    const candidates = (orders ?? []).filter(
      (o: { total: number }) => Math.abs(Number(o.total) - amount) <= AMOUNT_TOLERANCE
    );

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No matching unpaid UPI order" }, { status: 404 });
    }
    if (candidates.length > 1) {
      return NextResponse.json({ error: "Multiple orders match this amount — manual review needed" }, { status: 409 });
    }

    const match = candidates[0];
    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", match.id)
      .eq("payment_status", "unpaid");

    if (updateError) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ success: true, order_id: match.id, matched_by: "amount" });
  }

  return NextResponse.json({ error: "Provide order_id or amount" }, { status: 400 });
}
