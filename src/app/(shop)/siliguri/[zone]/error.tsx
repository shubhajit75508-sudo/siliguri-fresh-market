"use client";

import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";

export default function ZoneError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <MapPin className="h-8 w-8 text-danger" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Delivery zone not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        We don&apos;t currently deliver to this area. Check our available zones or contact us on WhatsApp.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D7D3A] px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-[#23682E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
