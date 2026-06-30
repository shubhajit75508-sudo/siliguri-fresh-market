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
  try {
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

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);

    if (error) {
      console.warn("[webhook] payment_status update skipped (column may not exist yet):", error.message);
    }
  }

  return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[webhook] error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
