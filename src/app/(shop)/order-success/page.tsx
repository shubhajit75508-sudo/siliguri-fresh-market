"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, Package, MapPin, Truck, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/animations/motion-wrapper";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <FadeIn>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7D3A]/10 animate-bounce">
            <CheckCircle className="h-12 w-12 text-[#2D7D3A]" />
          </div>

          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            Order Placed Successfully!
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Thank you for choosing Siliguri Fresh Mart. We&apos;re preparing your order now.
          </p>

          {orderId && (
            <div className="mt-5 rounded-xl border border-[#2D7D3A]/20 bg-[#2D7D3A]/5 px-5 py-3">
              <p className="text-xs text-muted">Order ID</p>
              <p className="font-mono text-sm font-bold text-[#2D7D3A]">#{orderId.slice(0, 8).toUpperCase()}</p>
            </div>
          )}

          <div className="mt-8 w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5A623]/10">
                <Package className="h-5 w-5 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Order Confirmed</p>
                <p className="text-xs text-muted">We&apos;ve received your order details</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2D7D3A]/10">
                <MapPin className="h-5 w-5 text-[#2D7D3A]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Preparing Your Order</p>
                <p className="text-xs text-muted">Fresh items being packed at our store</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10">
                <Truck className="h-5 w-5 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">On the Way</p>
                <p className="text-xs text-muted">Delivered within 30 minutes</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {orderId && (
              <Link
                href={`/track/${orderId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D7D3A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#2D7D3A]/20 transition-all hover:bg-[#23682E] hover:shadow-xl active:scale-[0.97]"
              >
                Track Your Order
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-alt"
            >
              Continue Shopping
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted">
            Questions? WhatsApp us at{" "}
            <a
              href="https://wa.me/917029908278"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#25D366] hover:underline"
            >
              7029908278
            </a>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center text-sm text-muted">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
