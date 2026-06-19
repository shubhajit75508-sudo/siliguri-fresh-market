import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  const isValid = verifyWebhookSignature(body, signature, webhookSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  let event: {
    event: string;
    payload: {
      payment?: { entity?: { notes?: Record<string, string> } };
      order?: { entity?: { receipt?: string } };
    };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const orderId =
      event.payload?.payment?.entity?.notes?.order_id ??
      event.payload?.order?.entity?.receipt;

    if (!orderId) {
      return NextResponse.json({ error: "No order ID in webhook payload" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (!existing) {
      console.warn("[webhook] order %s not found yet — payment captured before order creation", orderId);
      return NextResponse.json({ success: true, note: "Order not yet created, will be paid on creation" });
    }

    if (existing.payment_status === "paid") {
      return NextResponse.json({ success: true, note: "Already paid" });
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);

    if (error) {
      console.error("[webhook] DB update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
