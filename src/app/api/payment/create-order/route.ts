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
    return NextResponse.json({ 
      error: "Razorpay not configured", 
      keyId: keyId ? "set" : "MISSING", 
      keySecret: keySecret ? "set" : "MISSING",
      hint: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel env vars"
    }, { status: 501 });
  }

  try {
    const { amount, currency, receipt, notes } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Amount must be at least ₹1" }, { status: 400 });
    }

    let order;
    try {
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: currency || "INR",
        receipt: receipt || "rcpt_" + Date.now(),
        notes: notes || {},
      });
    } catch (razErr: any) {
      return NextResponse.json({ 
        error: "Razorpay API error", 
        detail: razErr?.error?.description || razErr?.message || String(razErr),
        status: razErr?.statusCode || razErr?.code || "unknown"
      }, { status: 502 });
    }

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
  } catch (err: any) {
    console.error("Razorpay create order error:", err?.message || err);
    const msg = err?.error?.description || err?.message || "Failed to create payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
