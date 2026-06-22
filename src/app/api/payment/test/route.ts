import { NextResponse } from "next/server";

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const report: Record<string, unknown> = {
    RAZORPAY_KEY_ID: keyId ? `set (${keyId.slice(0, 8)}...)` : "MISSING",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? `set (${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.slice(0, 8)}...)` : "missing",
    RAZORPAY_KEY_SECRET: keySecret ? "set" : "MISSING",
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ? "set" : "missing",
    isLiveKey: keyId?.startsWith("rzp_live_"),
  };

  // Try to actually connect to Razorpay
  if (keyId && keySecret) {
    try {
      const Razorpay = require("razorpay");
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      // Just test the connection by trying to fetch order (will fail but shows connectivity)
      try {
        const orders = await rzp.orders.all({ count: 1 });
        report.razorpayConnection = "OK";
        report.sample = `Fetched ${orders?.items?.length || 0} orders`;
      } catch (apiErr: any) {
        report.razorpayConnection = "API reachable";
        report.razorpayError = apiErr?.error?.description || apiErr?.message || String(apiErr);
      }
    } catch (initErr: any) {
      report.razorpayConnection = "FAILED";
      report.razorpayInitError = initErr?.message || String(initErr);
    }
  }

  return NextResponse.json(report);
}
