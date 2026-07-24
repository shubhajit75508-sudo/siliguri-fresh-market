import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ status: "unknown", error: "Payment service not configured" });
  }

  const orderId = req.nextUrl.searchParams.get("order_id");
  if (!orderId) {
    return NextResponse.json({ status: "unknown", error: "Missing order_id" }, { status: 400 });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      return NextResponse.json({ status: "unknown", error: "Failed to fetch order status" });
    }

    const order = await res.json();

    if (order.status === "paid") {
      // Fetch the payment details for this order
      const paymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
        headers: { Authorization: `Basic ${auth}` },
      });

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const capturedPayment = paymentsData.items?.find(
          (p: any) => p.status === "captured"
        );

        if (capturedPayment) {
          // Check if this payment was already used to create an order
          const supabase = getSupabaseAdmin();
          let alreadyUsed = false;
          if (supabase) {
            const { data } = await supabase
              .from("orders")
              .select("id")
              .eq("id", orderId)
              .maybeSingle();
            alreadyUsed = !!data;
          }

          return NextResponse.json({
            status: "paid",
            payment_id: capturedPayment.id,
            // Only return signature if not already used (for verification)
            signature: alreadyUsed ? null : capturedPayment.signature || null,
            amount: capturedPayment.amount / 100,
          });
        }
      }

      // Paid but no captured payment found yet
      return NextResponse.json({ status: "paid" });
    }

    if (order.status === "created" || order.status === "attempted") {
      return NextResponse.json({ status: "pending" });
    }

    return NextResponse.json({ status: order.status || "unknown" });
  } catch (err) {
    console.error("[payment-status] Error:", err);
    return NextResponse.json({ status: "unknown", error: "Failed to check status" });
  }
}
