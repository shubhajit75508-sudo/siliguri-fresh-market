"use client";

import { useState } from "react";
import { Star, X, MessageCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const GBP_REVIEW_URL = "https://g.page/r/CYExample/review";

const WHATSAPP_MSG = encodeURIComponent(
  "Hi Siliguri Fresh Mart! I just received my order and wanted to share my feedback. Great freshness and fast delivery!"
);

interface ReviewPromptProps {
  customerName?: string;
  className?: string;
}

export function ReviewPrompt({ customerName, className }: ReviewPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={cn("rounded-2xl border border-[#2D7D3A]/20 bg-gradient-to-br from-[#2D7D3A]/5 to-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2D7D3A]/10">
            <Star className="h-5 w-5 text-[#2D7D3A] fill-[#2D7D3A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {customerName ? `Loved your order, ${customerName}?` : "Loved your order?"}
            </h3>
            <p className="text-xs text-muted mt-0.5">Your review helps us serve Siliguri better!</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-muted hover:bg-surface hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <a
          href={GBP_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2D7D3A] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2D7D3A]/20 transition-all hover:bg-[#23682E] hover:shadow-lg active:scale-[0.97]"
        >
          <Star className="h-4 w-4" />
          Leave a Google Review
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
        <a
          href={`https://wa.me/917029908278?text=${WHATSAPP_MSG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#25D366]/30 bg-[#25D366]/5 px-4 py-2.5 text-sm font-bold text-[#25D366] transition-all hover:bg-[#25D366]/10 hover:border-[#25D366]/50 active:scale-[0.97]"
        >
          <MessageCircle className="h-4 w-4" />
          Tell us on WhatsApp
        </a>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="mt-3 w-full text-center text-[11px] text-muted hover:text-foreground transition-colors"
      >
        Maybe later
      </button>
    </div>
  );
}
