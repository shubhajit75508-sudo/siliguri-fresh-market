"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CallbackPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [sfmOrderId, setSfmOrderId] = useState("");

  useEffect(() => {
    const paymentId = params.get("payment_id");
    const razorpayOrderId = params.get("order_id");
    const signature = params.get("signature");
    const error = params.get("error");
    const sfmId = params.get("sfm_order_id") || "";

    setSfmOrderId(sfmId);

    if (error) {
      setStatus("failed");
      setTimeout(() => {
        tryDeepLink("failed", sfmId);
      }, 1500);
      return;
    }

    if (!paymentId || !razorpayOrderId || !signature || !sfmId) {
      setStatus("failed");
      setTimeout(() => {
        tryDeepLink("failed", sfmId);
      }, 1500);
      return;
    }

    fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sfmOrderId: sfmId,
        razorpayPaymentId: paymentId,
        razorpayOrderId: razorpayOrderId,
        razorpaySignature: signature,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            tryDeepLink("success", sfmId);
          }, 1500);
        } else {
          setStatus("failed");
          setTimeout(() => {
            tryDeepLink("failed", sfmId);
          }, 1500);
        }
      })
      .catch(() => {
        setStatus("failed");
        setTimeout(() => {
          tryDeepLink("failed", sfmId);
        }, 1500);
      });
  }, []);

  function tryDeepLink(result: string, orderId: string) {
    const url = "com.siligurifreshmart.app://payment?status=" + result + "&sfm_order_id=" + encodeURIComponent(orderId);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
      if (result === "success") {
        window.location.href = "/track/" + encodeURIComponent(orderId);
      } else {
        window.location.href = "/checkout?payment_failed=true";
      }
    }, 2000);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1f1c] text-white gap-4 px-4">
      {status === "verifying" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-[#2ecc71]" />
          <p className="text-lg font-semibold">Verifying payment...</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2ecc71]/20">
            <CheckCircle className="h-8 w-8 text-[#2ecc71]" />
          </div>
          <p className="text-xl font-bold">Payment Successful!</p>
          <p className="text-sm text-[#80949b]">Redirecting to your order...</p>
        </>
      )}
      {status === "failed" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/20">
            <XCircle className="h-8 w-8 text-brand-red" />
          </div>
          <p className="text-xl font-bold">Payment Failed</p>
          <p className="text-sm text-[#80949b]">Redirecting back to checkout...</p>
        </>
      )}
    </div>
  );
}
