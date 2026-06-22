import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, amount } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(amount ? { amount: Math.round(amount * 100) } : {}),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.description || "Refund failed" }, { status: res.status });
    }

    return NextResponse.json({ success: true, refund: data });
  } catch {
    return NextResponse.json({ error: "Refund processing failed" }, { status: 500 });
  }
}
