"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, X, Loader2, Shield, Smartphone,
  ArrowLeft, Clock, CreditCard, Zap, AlertTriangle,
  Copy, ExternalLink, Leaf, Truck,
} from "lucide-react";
import QRCode from "qrcode";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Address } from "@/types";

export type PaymentState =
  | "ready"
  | "opening"
  | "verifying"
  | "success"
  | "failed"
  | "cancelled"
  | "expired";

export interface PaymentScreenProps {
  items: CartItem[];
  total: number;
  address: Address;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  userId?: string;
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
}

const UPI_VPA = "shubhajit75508@okhdfcbank";
const MERCHANT_NAME = "Siliguri Fresh Mart";

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  key_id: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function generateOrderId(): string {
  return "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
}

function buildUpiDeepLink(
  app: "gpay" | "phonepe" | "paytm" | "bhim",
  amount: number,
  orderId: string
): string {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderId}`,
    mode: "01",
  });
  const base = params.toString();
  switch (app) {
    case "gpay":
      return `gpay://upi/pay?${base}`;
    case "phonepe":
      return `phonepe://pay?${base}`;
    case "paytm":
      return `paytmmp://pay?${base}`;
    case "bhim":
      return `bhim://pay?${base}`;
  }
}

function buildUpiQrString(amount: number, orderId: string): string {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderId}`,
    mode: "01",
  });
  return `upi://pay?${params.toString()}`;
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default function PaymentScreen({
  items,
  total,
  address,
  customerName,
  customerPhone,
  customerEmail,
  userId,
  onSuccess,
  onCancel,
}: PaymentScreenProps) {
  const [state, setState] = useState<PaymentState>("ready");
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const orderIdRef = useRef(generateOrderId());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const orderId = orderIdRef.current;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Generate QR code for desktop
  useEffect(() => {
    if (!isMobileDevice()) {
      const qrString = buildUpiQrString(total, orderId);
      QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      }).then((url) => {
        if (mountedRef.current) setQrDataUrl(url);
      }).catch(() => {});
    }
  }, [total, orderId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const createRazorpayOrder = useCallback(async (): Promise<RazorpayOrderResponse | null> => {
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          receipt: orderId,
          notes: { order_id: orderId, customer_name: customerName },
        }),
      });
      if (!res.ok) throw new Error("Failed to create payment order");
      return await res.json();
    } catch {
      return null;
    }
  }, [total, orderId, customerName]);

  const verifyPayment = useCallback(async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }, []);

  const createSupabaseOrder = useCallback(async (paymentId: string): Promise<string | null> => {
    const API = "/api/orders";
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    const eta = 30 + Math.floor(Math.random() * 31);
    const now = new Date().toISOString();

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          items: items.map((i) => ({
            product: { id: i.product.id, name: i.product.name, price: i.product.price, image: i.product.image },
            quantity: i.quantity,
            selectedWeight: i.selectedWeight,
            selectedCut: i.selectedCut,
            selectedCleaning: i.selectedCleaning,
          })),
          total,
          status: "received",
          payment_method: "upi",
          payment_status: "paid",
          payment_id: paymentId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          address_snapshot: address as unknown as Record<string, unknown>,
          created_at: now,
          eta,
          delivery_status: "pending",
          user_id: userId ?? null,
          delivery_code: deliveryCode,
        }),
      });
      if (!res.ok) throw new Error("Order creation failed");
      return orderId;
    } catch (e) {
      console.error("Order creation error:", e);
      return null;
    }
  }, [orderId, items, total, address, customerName, customerPhone, customerEmail, userId]);

  const startPayment = useCallback(async (method?: "gpay" | "phonepe" | "paytm" | "bhim") => {
    setState("opening");
    setErrorMessage("");

    const razorpayOrder = await createRazorpayOrder();
    if (!razorpayOrder) {
      setState("failed");
      setErrorMessage("Unable to connect to payment service. Please try again.");
      return;
    }
    setRazorpayOrder(razorpayOrder);

    // On mobile with specific app selected: try deep link first, fall back to Razorpay
    if (method && isMobileDevice()) {
      const deepLink = buildUpiDeepLink(method, total, orderId);
      window.location.href = deepLink;

      // Set a timeout - if user comes back, we'll check payment status
      setTimeout(() => {
        if (mountedRef.current && state === "opening") {
          setState("verifying");
          pollPaymentStatus(razorpayOrder.id);
        }
      }, 3000);
      return;
    }

    // Open Razorpay checkout with UPI pre-selected
    const razorpayLoaded = await loadRazorpayScript();
    if (!razorpayLoaded) {
      setState("failed");
      setErrorMessage("Payment service unavailable. Please try again later.");
      return;
    }

    const Rzpay = (window as any).Razorpay;
    const rzp = new Rzpay({
      key: razorpayOrder.key_id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: MERCHANT_NAME,
      description: "Fresh Market Delivery",
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
        method: "upi",
      },
      config: {
        display: {
          blocks: {
            upi_block: {
              name: "Pay using UPI",
              instruments: [{ method: "upi" }],
            },
          },
          sequence: ["block.upi_block"],
          preferences: { show_default_blocks: false },
        },
      },
      theme: { color: "#2D7D3A" },
      handler: async (response: any) => {
        if (!mountedRef.current) return;
        setState("verifying");
        setVerifying(true);

        const isValid = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (!isValid) {
          // Try polling as fallback
          pollPaymentStatus(razorpayOrder.id);
          return;
        }

        const sfmOrderId = await createSupabaseOrder(response.razorpay_payment_id);
        if (!mountedRef.current) return;

        if (sfmOrderId) {
          setState("success");
          setTimeout(() => onSuccess(sfmOrderId), 1500);
        } else {
          setState("failed");
          setErrorMessage("Payment received but order creation failed. Please contact support with payment ID: " + response.razorpay_payment_id);
        }
      },
      modal: {
        ondismiss: () => {
          if (!mountedRef.current) return;
          setState("cancelled");
        },
        confirm_close: true,
        escape: false,
      },
    });
    rzp.open();
  }, [total, orderId, customerName, customerPhone, customerEmail, address, items, userId, createRazorpayOrder, verifyPayment, createSupabaseOrder, onSuccess, state]);

  const pollPaymentStatus = useCallback(async (rzOrderId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes at 5s intervals

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts || !mountedRef.current) {
        if (pollRef.current) clearInterval(pollRef.current);
        if (mountedRef.current) {
          setState("expired");
          setErrorMessage("Payment verification timed out. Please check your bank statement.");
        }
        return;
      }

      try {
        const res = await fetch(`/api/payment/status?order_id=${rzOrderId}`);
        const data = await res.json();

        if (data.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);

          // Payment confirmed by Razorpay - verify signature and create order
          if (data.payment_id && data.signature) {
            const isValid = await verifyPayment(rzOrderId, data.payment_id, data.signature);
            if (isValid) {
              const sfmOrderId = await createSupabaseOrder(data.payment_id);
              if (mountedRef.current && sfmOrderId) {
                setState("success");
                setTimeout(() => onSuccess(sfmOrderId), 1500);
                return;
              }
            }
          }

          // If we got payment_id but no signature (webhook confirmed), create order directly
          if (data.payment_id && !data.signature) {
            const sfmOrderId = await createSupabaseOrder(data.payment_id);
            if (mountedRef.current && sfmOrderId) {
              setState("success");
              setTimeout(() => onSuccess(sfmOrderId), 1500);
              return;
            }
          }
        }

        if (data.status === "failed" || data.status === "cancelled") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (mountedRef.current) {
            setState(data.status === "cancelled" ? "cancelled" : "failed");
          }
        }
      } catch {
        // Network error - continue polling
      }
    }, 5000);
  }, [verifyPayment, createSupabaseOrder, onSuccess]);

  const totalItems = items.reduce((n, i) => n + i.quantity, 0);

  // ── SUCCESS STATE ──
  if (state === "success") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10 animate-[scaleIn_0.3s_ease-out]">
              <CheckCircle className="h-10 w-10 text-[#2D7D3A]" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Payment Successful</h1>
            <p className="mt-2 text-sm text-muted">Your order has been confirmed</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Amount Paid</span>
              <span className="font-bold text-foreground">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order Number</span>
              <span className="font-mono font-bold text-foreground">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Payment</span>
              <span className="font-semibold text-[#2D7D3A]">UPI ✓</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery</span>
              <span className="font-medium text-foreground">within 45–60 min</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#2D7D3A]/5 border border-[#2D7D3A]/10 p-3 text-xs text-muted">
            <Truck className="mr-1 inline h-3.5 w-3.5" />
            Your order is being prepared for delivery
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => onSuccess(orderId)}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors"
            >
              Track Order →
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED STATE ──
  if (state === "failed") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 animate-[scaleIn_0.3s_ease-out]">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Payment Unsuccessful</h1>
            <p className="mt-2 text-sm text-muted">
              Your order has not been confirmed and you have not been charged.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => { setState("ready"); setErrorMessage(""); }}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors"
            >
              Return to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CANCELLED STATE ──
  if (state === "cancelled") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 animate-[scaleIn_0.3s_ease-out]">
              <X className="h-10 w-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Payment Not Completed</h1>
            <p className="mt-2 text-sm text-muted">
              You haven&apos;t been charged. Would you like to try again?
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => { setState("ready"); setErrorMessage(""); }}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors"
            >
              Return to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EXPIRED STATE ──
  if (state === "expired") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 animate-[scaleIn_0.3s_ease-out]">
              <Clock className="h-10 w-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Payment Timed Out</h1>
            <p className="mt-2 text-sm text-muted">
              We couldn&apos;t confirm the payment within the expected time.
              {errorMessage && <span className="block mt-1">{errorMessage}</span>}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => { setState("ready"); setErrorMessage(""); }}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors"
            >
              Return to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VERIFYING STATE ──
  if (state === "verifying") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10">
              <Loader2 className="h-10 w-10 text-[#2D7D3A] animate-spin" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Verifying Your Payment</h1>
            <p className="mt-2 text-sm text-muted">Please don&apos;t close this page</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Amount</span>
              <span className="font-bold text-foreground">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order</span>
              <span className="font-mono font-bold text-foreground">{orderId}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <Shield className="h-3.5 w-3.5" />
            Secure payment verification in progress
          </div>
        </div>
      </div>
    );
  }

  // ── OPENING STATE ──
  if (state === "opening") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10">
              <Loader2 className="h-10 w-10 text-[#2D7D3A] animate-spin" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Opening Payment</h1>
            <p className="mt-2 text-sm text-muted">Please complete payment in your UPI app</p>
          </div>
        </div>
      </div>
    );
  }

  // ── READY STATE (main payment screen) ──
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#2D7D3A]" />
            <span className="text-xs font-bold text-[#2D7D3A]">SECURE PAYMENT</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2D7D3A]/10 mb-3">
            <Leaf className="h-7 w-7 text-[#2D7D3A]" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Siliguri Fresh Mart</h1>
          <p className="text-xs text-muted mt-0.5">Freshness delivered to your door</p>
        </div>

        {/* Amount Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#2D7D3A] to-[#1a5c25] p-5 mb-5 text-white shadow-lg shadow-[#2D7D3A]/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">Amount to Pay</p>
          <p className="text-4xl font-extrabold tabular-nums">{formatPrice(total)}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
            <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
            <span>•</span>
            <span>Free Delivery</span>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="rounded-2xl border border-border p-4 mb-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2">
              <Smartphone className="h-4 w-4 text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{customerName}</p>
              <p className="text-xs text-muted">{customerPhone}</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2">
              <Truck className="h-4 w-4 text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#2D7D3A] uppercase tracking-wider">{address.label || "Delivery Address"}</p>
              <p className="text-xs text-muted mt-0.5 truncate">
                {address.building && `${address.building}, `}
                {address.street && `${address.street}, `}
                {address.area && `${address.area}, `}
                {address.landmark && `Near ${address.landmark}, `}
                {address.city} — {address.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary (collapsible) */}
        <details className="rounded-2xl border border-border mb-5 group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-bold text-foreground">
            <span>Order Summary ({totalItems} items)</span>
            <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted truncate flex-1 mr-2">
                  {item.product.name} × {item.quantity}
                  {item.selectedWeight ? ` (${item.selectedWeight})` : ""}
                </span>
                <span className="font-semibold text-foreground whitespace-nowrap">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-xs font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </details>

        {/* UPI Payment Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-[#2D7D3A]" />
            <h2 className="text-sm font-bold text-foreground">Pay with UPI</h2>
          </div>

          {/* Mobile: UPI App Buttons */}
          {isMobileDevice() ? (
            <div className="space-y-2">
              {([
                { id: "gpay" as const, name: "Google Pay", icon: "G", color: "#4285F4" },
                { id: "phonepe" as const, name: "PhonePe", icon: "P", color: "#5F259F" },
                { id: "paytm" as const, name: "Paytm", icon: "₹", color: "#00BAF2" },
                { id: "bhim" as const, name: "BHIM UPI", icon: "B", color: "#097969" },
              ]).map((app) => (
                <button
                  key={app.id}
                  onClick={() => startPayment(app.id)}
                  className="flex items-center gap-3 w-full p-4 rounded-2xl border-2 border-border bg-white hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5 active:scale-[0.98] transition-all"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: app.color }}
                  >
                    {app.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-foreground">{app.name}</span>
                    <p className="text-[11px] text-muted">Tap to pay</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted" />
                </button>
              ))}
            </div>
          ) : (
            /* Desktop: QR Code + Other Options */
            <div className="space-y-4">
              {/* QR Code */}
              <div className="rounded-2xl border border-border bg-white p-5 text-center">
                <p className="text-xs font-semibold text-muted mb-3">
                  Scan QR code with any UPI app
                </p>
                {qrDataUrl ? (
                  <div className="inline-block rounded-xl border border-border p-3 bg-white">
                    <img src={qrDataUrl} alt="UPI QR Code" className="w-52 h-52" />
                  </div>
                ) : (
                  <div className="w-52 h-52 mx-auto flex items-center justify-center bg-surface-2 rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-muted" />
                  </div>
                )}
                <p className="text-[10px] text-muted mt-3">
                  Works with Google Pay, PhonePe, Paytm, BHIM & all UPI apps
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">or pay via app</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* UPI Apps (all open Razorpay checkout) */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { name: "Google Pay", icon: "G", color: "#4285F4" },
                  { name: "PhonePe", icon: "P", color: "#5F259F" },
                  { name: "Paytm", icon: "₹", color: "#00BAF2" },
                  { name: "BHIM UPI", icon: "B", color: "#097969" },
                ]).map((app) => (
                  <button
                    key={app.name}
                    onClick={() => startPayment()}
                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-border bg-white hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5 active:scale-[0.98] transition-all"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold text-white"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.icon}
                    </div>
                    <span className="text-xs font-bold text-foreground">{app.name}</span>
                  </button>
                ))}
              </div>

              {/* Copy UPI ID */}
              <div className="rounded-xl border border-dashed border-border p-3 text-center">
                <p className="text-[10px] text-muted mb-1.5">Or send money directly to UPI ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-mono font-bold text-foreground">{UPI_VPA}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(UPI_VPA);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-muted hover:bg-surface-2 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-4 pb-8 flex-wrap">
          {["Secure Checkout", "100% Fresh", "Free Delivery"].map((t) => (
            <span key={t} className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1">
              {t === "Secure Checkout" ? <Shield className="h-3 w-3" /> : t === "100% Fresh" ? <Leaf className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
