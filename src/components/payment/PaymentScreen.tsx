"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle, X, Loader2, Shield, Smartphone,
  ArrowLeft, Clock, CreditCard, AlertTriangle,
  Copy, ExternalLink, Leaf, Truck, Banknote,
} from "lucide-react";
import QRCode from "qrcode";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Address } from "@/types";

export type PaymentState =
  | "ready"
  | "opening"
  | "awaiting"
  | "submitting"
  | "success"
  | "failed"
  | "cancelled";

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

function generateOrderId(): string {
  return "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
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
  const [errorMessage, setErrorMessage] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [upiRef, setUpiRef] = useState("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const orderId = generateOrderId();

  // Generate QR code for desktop
  useState(() => {
    if (!isMobileDevice()) {
      const qrString = buildUpiQrString(total, orderId);
      QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      }).then((url) => setQrDataUrl(url)).catch(() => {});
    }
  });

  const handleAppSelect = useCallback((app: "gpay" | "phonepe" | "paytm" | "bhim", appName: string) => {
    setSelectedApp(appName);
    setState("opening");

    // Open UPI deep link
    const deepLink = buildUpiDeepLink(app, total, orderId);
    window.location.href = deepLink;

    // After a short delay, show the "awaiting payment" state
    setTimeout(() => {
      setState("awaiting");
    }, 2000);
  }, [total, orderId]);

  const handleSubmitPayment = useCallback(async () => {
    if (!upiRef.trim()) {
      setErrorMessage("Please enter the UPI reference number");
      return;
    }

    setState("submitting");
    setErrorMessage("");

    try {
      const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
      const eta = 30 + Math.floor(Math.random() * 31);
      const now = new Date().toISOString();

      const res = await fetch("/api/orders", {
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
          payment_status: "unpaid",
          upi_reference: upiRef.trim(),
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

      setState("success");
      setTimeout(() => onSuccess(orderId), 2000);
    } catch (e) {
      console.error("Order creation error:", e);
      setState("failed");
      setErrorMessage("Failed to submit order. Please try again.");
    }
  }, [upiRef, orderId, items, total, address, customerName, customerPhone, customerEmail, userId, onSuccess]);

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
            <h1 className="text-2xl font-extrabold text-foreground">Order Placed!</h1>
            <p className="mt-2 text-sm text-muted">Your order has been received</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2 p-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Amount</span>
              <span className="font-bold text-foreground">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order Number</span>
              <span className="font-mono font-bold text-foreground">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Payment</span>
              <span className="font-semibold text-orange-600">Pending Verification</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery</span>
              <span className="font-medium text-foreground">within 45–60 min</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700">
            Your UPI reference <span className="font-mono font-bold">{upiRef}</span> is being verified.
            <br />Your order will be confirmed shortly after payment verification.
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => onSuccess(orderId)}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors"
            >
              Track Order
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
            <h1 className="text-2xl font-extrabold text-foreground">Something Went Wrong</h1>
            <p className="mt-2 text-sm text-muted">{errorMessage || "Please try again."}</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { setState("ready"); setErrorMessage(""); setUpiRef(""); }}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors"
            >
              Try Again
            </button>
            <button onClick={onCancel} className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors">
              Return to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMITTING STATE ──
  if (state === "submitting") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10">
            <Loader2 className="h-10 w-10 text-[#2D7D3A] animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Placing Your Order</h1>
          <p className="mt-2 text-sm text-muted">Please wait...</p>
        </div>
      </div>
    );
  }

  // ── AWAITING PAYMENT STATE ──
  if (state === "awaiting") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
            <button onClick={() => setState("ready")} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="text-xs font-bold text-orange-600">AWAITING PAYMENT</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full flex flex-col items-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10">
            <Loader2 className="h-10 w-10 text-[#2D7D3A] animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground text-center">Complete Payment in {selectedApp}</h1>
          <p className="mt-2 text-sm text-muted text-center">Enter your UPI PIN to pay {formatPrice(total)}</p>

          <div className="mt-8 rounded-2xl border border-border p-5 w-full space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Paying to</span>
              <span className="font-bold text-foreground">{MERCHANT_NAME}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Amount</span>
              <span className="font-extrabold text-foreground text-lg">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order</span>
              <span className="font-mono font-bold text-foreground text-xs">{orderId}</span>
            </div>
          </div>

          <div className="mt-6 w-full space-y-3">
            <p className="text-xs font-bold text-muted text-center uppercase tracking-wider">
              After payment, enter your UPI reference number below
            </p>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">
                UPI Reference Number <span className="text-brand-red text-xs">*</span>
              </label>
              <input
                type="text"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                placeholder="e.g. 123456789012"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10 tabular-nums"
              />
              <p className="text-[10px] text-muted mt-1">
                Find this in your {selectedApp} app under transaction details
              </p>
            </div>
            {errorMessage && (
              <p className="text-xs text-red-500 text-center">{errorMessage}</p>
            )}
            <button
              onClick={handleSubmitPayment}
              disabled={!upiRef.trim()}
              className="w-full rounded-xl bg-[#2D7D3A] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2D7D3A]/20 hover:bg-[#23682E] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Payment & Place Order
            </button>
          </div>

          <button
            onClick={() => { setState("ready"); setUpiRef(""); setErrorMessage(""); }}
            className="mt-4 text-xs text-muted hover:text-foreground underline"
          >
            ← Choose a different UPI app
          </button>
        </div>
      </div>
    );
  }

  // ── OPENING STATE ──
  if (state === "opening") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10">
            <Loader2 className="h-10 w-10 text-[#2D7D3A] animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Opening {selectedApp}</h1>
          <p className="mt-2 text-sm text-muted">Complete payment in your UPI app</p>
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
            <ArrowLeft className="h-4 w-4" /> Back
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

          {isMobileDevice() ? (
            /* Mobile: UPI App Buttons (open apps directly) */
            <div className="space-y-2">
              {([
                { id: "gpay" as const, name: "Google Pay", icon: "G", color: "#4285F4" },
                { id: "phonepe" as const, name: "PhonePe", icon: "P", color: "#5F259F" },
                { id: "paytm" as const, name: "Paytm", icon: "₹", color: "#00BAF2" },
                { id: "bhim" as const, name: "BHIM UPI", icon: "B", color: "#097969" },
              ]).map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppSelect(app.id, app.name)}
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
                    <p className="text-[11px] text-muted">Tap to pay {formatPrice(total)}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted" />
                </button>
              ))}
            </div>
          ) : (
            /* Desktop: QR Code */
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-white p-5 text-center">
                <p className="text-xs font-semibold text-muted mb-3">
                  Scan QR code with any UPI app to pay
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
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">or pay via UPI ID</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Copy UPI ID */}
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <p className="text-[10px] text-muted mb-2">Send payment to this UPI ID</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-mono font-bold text-foreground">{UPI_VPA}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(UPI_VPA);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:bg-surface-2 transition-colors"
                  >
                    <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Desktop: Enter reference after scanning */}
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <p className="text-xs font-bold text-foreground">After paying, enter your UPI reference number:</p>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="UPI Reference / Transaction ID"
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10 tabular-nums"
                />
                <p className="text-[10px] text-muted">
                  Find this in your UPI app under transaction details
                </p>
                {errorMessage && (
                  <p className="text-xs text-red-500">{errorMessage}</p>
                )}
                <button
                  onClick={handleSubmitPayment}
                  disabled={!upiRef.trim()}
                  className="w-full rounded-xl bg-[#2D7D3A] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2D7D3A]/20 hover:bg-[#23682E] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Payment & Place Order
                </button>
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
