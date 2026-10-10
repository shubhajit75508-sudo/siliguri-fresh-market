"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const FESTIVAL_WINDOW = { month: 9, dayStart: 8, dayEnd: 24 };

export function FestivalBanner() {
  const now = useMemo(() => new Date(), []);
  const show = useMemo(() => {
    const m = now.getMonth();
    const d = now.getDate();
    return m === FESTIVAL_WINDOW.month && d >= FESTIVAL_WINDOW.dayStart && d <= FESTIVAL_WINDOW.dayEnd;
  }, [now]);

  if (!show) return null;

  return (
    <Link
      href="/durgapuja"
      className="my-4 flex items-center gap-3 rounded-xl border border-[#F4B942]/40 bg-gradient-to-r from-[#FDF3DD] via-[#FFE9B8] to-[#FBE3A0] px-4 py-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99] sm:px-6 sm:py-4"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4B942] to-[#E8930C] text-white shadow-md shadow-[#F4B942]/30">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#7A4A00] sm:text-base">
          Pujo Special 2026 — Fresh Fish & Meat for Durga Puja
        </p>
        <p className="text-xs text-[#A0721B]">
          Shashthi to Dashami (17–21 Oct) · Same-day delivery at your pandal doorstep
        </p>
      </div>
      <span className="whitespace-nowrap rounded-full bg-[#7A4A00] px-3 py-1.5 text-xs font-bold text-white">
        Plan Puja →
      </span>
    </Link>
  );
}