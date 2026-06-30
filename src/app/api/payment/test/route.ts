import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const report: Record<string, unknown> = {
    razorpayKeySet: !!keyId,
    razorpaySecretSet: !!keySecret,
    webhookSet: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    isLiveKey: keyId?.startsWith("rzp_live_"),
  };

  if (keyId && keySecret) {
    try {
      const Razorpay = require("razorpay");
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      try {
        const orders = await rzp.orders.all({ count: 1 });
        report.razorpayConnection = "OK";
        report.sampleCount = orders?.items?.length || 0;
      } catch {
        report.razorpayConnection = "API reachable";
        report.razorpayError = "Connection error";
      }
    } catch {
      report.razorpayConnection = "FAILED";
    }
  }

  return NextResponse.json(report);
}
