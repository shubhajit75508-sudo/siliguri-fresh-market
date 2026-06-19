import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 501 });
  }

  try {
    const { amount, currency, receipt, notes } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Amount must be at least ₹1" }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: currency || "INR",
      receipt: receipt || "rcpt_" + Date.now(),
      notes: notes || {},
    });

    if (receipt && receipt.startsWith("SFM-")) {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from("orders").upsert({
            id: receipt,
            items: [],
            total: Math.round(amount),
            status: "received",
            payment_method: "upi",
            address_snapshot: {},
            customer_name: notes?.customer_name ?? "",
            customer_phone: notes?.customer_phone ?? "",
            customer_email: notes?.customer_email ?? "",
            delivery_status: "pending",
            eta: 30,
            created_at: new Date().toISOString(),
          }, { onConflict: "id" });
        } catch (e) {
          console.warn("[create-order] pending order upsert skipped:", e);
        }
      }
    }

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
