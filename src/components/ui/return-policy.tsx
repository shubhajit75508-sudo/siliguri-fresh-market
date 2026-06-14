"use client";

import { useState } from "react";
import { RotateCcw, Phone, X, Clock, AlertTriangle } from "lucide-react";

export const CUSTOMER_CARE = "+91 98765 43210";
export const REPLACEMENT_WINDOW_MS = 3 * 60 * 60 * 1000;

export function isWithinReplacementWindow(deliveredAt?: string): boolean {
  if (!deliveredAt) return false;
  const elapsed = Date.now() - new Date(deliveredAt).getTime();
  return elapsed >= 0 && elapsed < REPLACEMENT_WINDOW_MS;
}

export function getRemainingTime(deliveredAt: string): string {
  const elapsed = Date.now() - new Date(deliveredAt).getTime();
  const remaining = REPLACEMENT_WINDOW_MS - elapsed;
  if (remaining <= 0) return "Expired";
  const hrs = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

export function ReturnPolicyBanner({ deliveredAt }: { deliveredAt?: string }) {
  const expired = deliveredAt ? !isWithinReplacementWindow(deliveredAt) : false;

  return (
    <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
      expired
        ? "bg-gray-50 border-gray-200 text-gray-400"
        : "bg-brand-orange/5 border-brand-orange/20 text-muted"
    }`}>
      {expired ? (
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
      ) : (
        <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange" />
      )}
      <p>
        {expired ? (
          <span className="text-gray-400">Replacement window has expired (available within 3 hours of delivery).</span>
        ) : (
          <>
            <span className="font-semibold text-brand-dark">Replacement only.</span>{" "}
            Available within 3 hours of delivery. Call{" "}
            <a href={`tel:${CUSTOMER_CARE}`} className="font-semibold text-brand-blue underline">
              {CUSTOMER_CARE}
            </a>
          </>
        )}
      </p>
    </div>
  );
}

export function ReturnRequestModal({ orderId, deliveredAt, onClose }: { orderId: string; deliveredAt?: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const expired = deliveredAt ? !isWithinReplacementWindow(deliveredAt) : false;

  if (expired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold">Window Expired</h3>
          <p className="mt-2 text-sm text-muted">
            The 3-hour replacement window for order {orderId} has closed. Please call customer care for assistance.
          </p>
          <button onClick={onClose} className="mt-6 w-full rounded-xl bg-brand-dark py-2.5 text-sm font-bold text-white">Done</button>
        </div>
      </div>
    );
  }

  const remaining = deliveredAt ? getRemainingTime(deliveredAt) : "3 hours";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-fresh/10">
              <RotateCcw className="h-6 w-6 text-brand-fresh" />
            </div>
            <h3 className="text-lg font-bold">Request Submitted</h3>
            <p className="mt-2 text-sm text-muted">
              Our team will reach out to you shortly to arrange the replacement for order {orderId}.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-brand-dark py-2.5 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Request Replacement</h3>
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-orange">
              <Clock className="h-3 w-3" />
              <span className="font-semibold">{remaining}</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              For replacement of order <span className="font-semibold text-brand-dark">{orderId}</span>, please call our customer care.
            </p>
            <a
              href={`tel:${CUSTOMER_CARE}`}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-fresh py-3 font-bold text-white hover:bg-brand-fresh-dim"
            >
              <Phone className="h-4 w-4" />
              Call {CUSTOMER_CARE}
            </a>
            <button
              onClick={() => setSent(true)}
              className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface"
            >
              I will call later — Submit request
            </button>
          </>
        )}
      </div>
    </div>
  );
}
