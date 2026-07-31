"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircle, X, Loader2, Shield, Smartphone,
  ArrowLeft, Clock, CreditCard, AlertTriangle,
  Copy, ExternalLink, Leaf, Truck,
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
  | "failed";

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

/** Persist the in-progress UPI payment so returning from the UPI app (even after a
 *  page reload) restores the "did you pay? enter reference" screen. */
const PENDING_KEY = "sfm-pending-payment";

interface PendingPayment {
  orderId: string;
  total: number;
  ts: number;
}

function savePendingPayment(orderId: string, total: number): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ orderId, total, ts: Date.now() } satisfies PendingPayment));
  } catch {}
}

function loadPendingPayment(): PendingPayment | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPayment;
    if (!parsed?.orderId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearPendingPayment(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}

function buildUpiIntentUrl(amount: number, orderId: string): string {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function buildOrderId(): string {
  return "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
}

/* ── UPI App Logos ── */
function GPayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#fff"/>
    </svg>
  );
}

function PhonePeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="#5F259F"/>
      <path d="M14.122 7.015c.576-.2 1.198-.318 1.878-.318 1.132 0 2.163.334 2.997.903v3.16c-.846-.584-1.9-.924-3.073-.924-.65 0-1.27.112-1.85.32v-3.14z" fill="#fff" opacity="0.9"/>
      <path d="M7.005 10.36c0-1.604.668-3.05 1.738-4.095.46-.444.978-.813 1.54-1.103v10.378c-.56-.29-1.076-.66-1.536-1.102A5.836 5.836 0 017.005 10.36z" fill="#fff" opacity="0.9"/>
      <path d="M10.283 16.736V7.653a8.34 8.34 0 00-1.853-.218 5.836 5.836 0 00-1.425 3.484 5.836 5.836 0 001.425 3.484c.614.72 1.32 1.283 2.102 1.666-.08.06-.16.116-.24.168l.001.001-.001.003z" fill="#fff" opacity="0.7"/>
      <text x="6" y="16" fill="#fff" fontSize="6.5" fontWeight="bold" fontFamily="Arial">Pe</text>
    </svg>
  );
}

function PaytmLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#00BAF2"/>
      <text x="4.5" y="17" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">Pay</text>
      <text x="15" y="17" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">tm</text>
    </svg>
  );
}

function BHIMLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#097969"/>
      <text x="3" y="17" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">BHIM</text>
    </svg>
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
  const [errorMessage, setErrorMessage] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [upiRef, setUpiRef] = useState("");
  const [selectedApp, setSelectedApp] = useState("");
  const [openFailed, setOpenFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const orderIdRef = useRef(buildOrderId());
  const orderId = orderIdRef.current;

  // Detect device AFTER hydration to avoid SSR mismatch, and restore an in-progress
  // payment if the customer is coming back from their UPI app.
  useEffect(() => {
    setIsMobile(isMobileDevice());

    const pending = loadPendingPayment();
    if (pending) {
      // Only reuse it if the amount still matches the current cart — otherwise start fresh.
      if (Math.abs(Number(pending.total) - total) < 1) {
        orderIdRef.current = pending.orderId;
        setState("awaiting");
        return;
      }
      clearPendingPayment();
    }

    savePendingPayment(orderId, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate QR code for desktop (only client-side)
  useEffect(() => {
    if (isMobile) return;
    const qrString = buildUpiIntentUrl(total, orderId);
    QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).then((url) => setQrDataUrl(url)).catch(() => {});
  }, [isMobile, total, orderId]);

  // Detect when the user returns from the UPI app instead of relying on a timeout.
  // Also surface a fallback if the app never opened (not installed / link blocked).
  useEffect(() => {
    if (state !== "opening") return;

    let opened = false;
    const onVisibility = () => {
      if (document.hidden) {
        opened = true;
      } else if (opened) {
        setState("awaiting");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const fallbackTimer = setTimeout(() => {
      if (!opened && document.visibilityState === "visible") {
        setOpenFailed(true);
      }
    }, 3000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(fallbackTimer);
    };
  }, [state]);

  const handleAppSelect = useCallback((appName: string) => {
    setSelectedApp(appName);
    setOpenFailed(false);
    setState("opening");

    // Android uses app-specific intent:// deep links. On iOS (or as a generic
    // fallback) the plain upi:// scheme triggers the system "open in app" chooser.
    let appUrl: string;
    if (isIOSDevice()) {
      appUrl = buildUpiIntentUrl(total, orderId);
    } else if (appName === "Google Pay") {
      appUrl = `intent://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}#Intent;package=com.google.android.apps.nbu.paisa.user;scheme=upi;end`;
    } else if (appName === "PhonePe") {
      appUrl = `intent://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}#Intent;package=com.phonepe.app;scheme=upi;end`;
    } else if (appName === "Paytm") {
      appUrl = `intent://pay?pa=${UPI_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}#Intent;package=com.paytm.mobileapp;scheme=upi;end`;
    } else {
      appUrl = buildUpiIntentUrl(total, orderId);
    }

    window.location.href = appUrl;
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

      clearPendingPayment();
      setState("success");
      setTimeout(() => onSuccess(orderId), 2000);
    } catch (e) {
      console.error("Order creation error:", e);
      setState("failed");
      setErrorMessage("Failed to submit order. Please try again.");
    }
  }, [upiRef, orderId, items, total, address, customerName, customerPhone, customerEmail, userId, onSuccess]);

  const handleCancel = useCallback(() => {
    clearPendingPayment();
    onCancel();
  }, [onCancel]);

  const copyVpa = () => {
    navigator.clipboard.writeText(UPI_VPA).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const totalItems = items.reduce((n, i) => n + i.quantity, 0);

  // ── SUCCESS ──
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
          </div>
          <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700">
            UPI ref <span className="font-mono font-bold">{upiRef}</span> is being verified. Your order will be confirmed shortly.
          </div>
          <div className="mt-6 space-y-2">
            <button onClick={() => onSuccess(orderId)} className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors">Track Order</button>
            <button onClick={() => window.location.href = "/"} className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED ──
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
            <button onClick={() => { setState("ready"); setErrorMessage(""); setUpiRef(""); }} className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white hover:bg-[#23682E] transition-colors">Try Again</button>
            <button onClick={handleCancel} className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted hover:bg-surface-2 transition-colors">Return to Checkout</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMITTING ──
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

  // ── AWAITING PAYMENT ──
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
          <h1 className="text-2xl font-extrabold text-foreground text-center">Complete Your Payment</h1>
          <p className="mt-2 text-sm text-muted text-center">Pay {formatPrice(total)} to the UPI ID below using any UPI app</p>

          <div className="mt-6 rounded-2xl border border-border p-5 w-full space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Paying to</p>
                <p className="text-sm font-bold text-foreground">{MERCHANT_NAME}</p>
              </div>
              <button
                onClick={copyVpa}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:bg-surface-2 transition-colors"
              >
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy UPI ID"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 border border-border px-3 py-2.5">
              <span className="text-sm font-mono font-bold text-foreground truncate">{UPI_VPA}</span>
              <span className="flex-shrink-0 text-[10px] font-bold text-[#2D7D3A] uppercase tracking-wider">UPI ID</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Amount</span>
              <span className="font-extrabold text-foreground text-lg">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order</span>
              <span className="font-mono font-bold text-foreground text-xs">{orderId}</span>
            </div>
            <p className="text-[10px] text-muted">
              Pay with any UPI app using the reference <span className="font-semibold text-foreground">{orderId}</span> so we can match your payment.
            </p>
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
                Find this in your UPI app under transaction details
              </p>
            </div>
            {errorMessage && <p className="text-xs text-red-500 text-center">{errorMessage}</p>}
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

  // ── OPENING ──
  if (state === "opening") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10">
            <Loader2 className="h-10 w-10 text-[#2D7D3A] animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Opening {selectedApp}</h1>
          <p className="mt-2 text-sm text-muted">Complete payment in your UPI app</p>

          {openFailed && (
            <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-bold text-orange-700">
                  {selectedApp} didn't open automatically?
                </p>
              </div>
              <p className="text-xs text-orange-700/80">
                Pay manually to <span className="font-mono font-bold">{UPI_VPA}</span> using any UPI app,
                then enter the transaction reference to confirm your order.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={copyVpa}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-50 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? "UPI ID Copied!" : "Copy UPI ID"}
                </button>
                <button
                  onClick={() => setState("awaiting")}
                  className="w-full rounded-xl bg-[#2D7D3A] py-2.5 text-xs font-bold text-white hover:bg-[#23682E] transition-colors"
                >
                  I've paid — enter reference
                </button>
              </div>
            </div>
          )}

          {!openFailed && (
            <button
              onClick={() => setState("ready")}
              className="mt-8 text-xs text-muted hover:text-foreground underline"
            >
              ← Choose a different UPI app
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── READY (main payment screen) ──
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button onClick={handleCancel} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
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

        {/* Order Summary */}
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

          {isMobile ? (
            <div className="space-y-2">
              {([
                { name: "Google Pay", color: "#4285F4", bgGrad: "from-[#4285F4] to-[#34A853]", Logo: GPayLogo },
                { name: "PhonePe", color: "#5F259F", bgGrad: "from-[#5F259F] to-[#7B3FC4]", Logo: PhonePeLogo },
                { name: "Paytm", color: "#00BAF2", bgGrad: "from-[#00BAF2] to-[#0096D6]", Logo: PaytmLogo },
                { name: "BHIM UPI", color: "#097969", bgGrad: "from-[#097969] to-[#0B9E8C]", Logo: BHIMLogo },
              ]).map((app) => (
                <button
                  key={app.name}
                  onClick={() => handleAppSelect(app.name)}
                  className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 border-border bg-white hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5 active:scale-[0.98] transition-all`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${app.bgGrad} shadow-md`}>
                    <app.Logo className="w-7 h-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-foreground">{app.name}</span>
                    <p className="text-[11px] text-muted">Tap to pay {formatPrice(total)}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted" />
                </button>
              ))}
              <button
                onClick={() => setState("awaiting")}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border-2 border-dashed border-[#2D7D3A]/30 bg-[#2D7D3A]/5 text-sm font-semibold text-[#2D7D3A] hover:bg-[#2D7D3A]/10 transition-all"
              >
                <Copy className="h-4 w-4" /> I'll pay via another UPI app
              </button>
            </div>
          ) : (
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
                <div className="flex items-center justify-center gap-3 mt-3">
                  {([GPayLogo, PhonePeLogo, PaytmLogo, BHIMLogo]).map((Logo, i) => (
                    <Logo key={i} className="w-6 h-6 opacity-50" />
                  ))}
                </div>
                <p className="text-[10px] text-muted mt-2">
                  Works with Google Pay, PhonePe, Paytm, BHIM & all UPI apps
                </p>
              </div>

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
                    onClick={copyVpa}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:bg-surface-2 transition-colors"
                  >
                    <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Desktop: Enter reference */}
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <p className="text-xs font-bold text-foreground">After paying, enter your UPI reference number:</p>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="UPI Reference / Transaction ID"
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10 tabular-nums"
                />
                <p className="text-[10px] text-muted">Find this in your UPI app under transaction details</p>
                {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
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

        {/* Footer */}
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
