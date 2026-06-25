import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 501 });
  }

  try {
    const { sfmOrderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

    if (!sfmOrderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", sfmOrderId);

    if (error) {
      console.warn("[payment/confirm] Failed to update order:", error.message);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment_id: razorpayPaymentId });
  } catch (err) {
    console.error("[payment/confirm] Error:", err);
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
