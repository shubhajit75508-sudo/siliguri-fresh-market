import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Razorpay not configured");
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 501 });
  }

  try {
    const { amount, currency, receipt, notes } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Amount must be at least Rs.1" }, { status: 400 });
    }

    let order;
    try {
      const RazorpayLib = require("razorpay");
      const RazorpayClass = RazorpayLib.default || RazorpayLib;
      const razorpay = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: currency || "INR",
        receipt: receipt || "rcpt_" + Date.now(),
        notes: notes || {},
      });
    } catch (razErr: any) {
      console.error("Razorpay create order failed:", razErr?.statusCode, razErr?.error?.code);
      return NextResponse.json({ error: "Payment service temporarily unavailable" }, { status: 502 });
    }

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (err: any) {
    console.error("Razorpay create order error:", err?.message || err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
