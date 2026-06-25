"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function PayPage() {
  const params = useSearchParams();

  useEffect(() => {
    const orderId = params.get("order_id");
    const amount = params.get("amount");
    const sfmOrderId = params.get("sfm_order_id");
    const name = params.get("name") || "";
    const phone = params.get("phone") || "";

    if (!orderId || !amount) {
      window.location.href = "/checkout?payment_error=missing_params";
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderId,
        amount: amount,
        currency: "INR",
        name: "Siliguri Fresh Mart",
        description: "Order Payment",
        image: "https://www.siligurifreshmart.com/logo.png",
        prefill: {
          name: name,
          contact: phone,
        },
        theme: { color: "#1a7a4a" },
        handler: function (response: any) {
          const callbackUrl =
            "/pay/callback" +
            "?payment_id=" + encodeURIComponent(response.razorpay_payment_id) +
            "&order_id=" + encodeURIComponent(response.razorpay_order_id) +
            "&signature=" + encodeURIComponent(response.razorpay_signature) +
            "&sfm_order_id=" + encodeURIComponent(sfmOrderId || "");
          window.location.href = callbackUrl;
        },
        modal: {
          ondismiss: function () {
            window.location.href = "/pay/callback?error=cancelled&sfm_order_id=" + encodeURIComponent(sfmOrderId || "");
          },
        },
      };

      (window as any).Razorpay(options).on("payment.failed", function (response: any) {
        window.location.href =
          "/pay/callback?error=true&order_id=" + encodeURIComponent(orderId) +
          "&sfm_order_id=" + encodeURIComponent(sfmOrderId || "");
      });

      (window as any).Razorpay(options).open();
    };
    script.onerror = () => {
      window.location.href = "/checkout?payment_error=script_failed";
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a1f1c]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#2ecc71] border-t-transparent" />
        <p className="text-white text-lg font-medium">Opening payment...</p>
      </div>
    </div>
  );
}
