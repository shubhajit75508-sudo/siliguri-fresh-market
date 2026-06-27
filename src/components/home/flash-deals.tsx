"use client";

import { Zap, Clock, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { ProductCard } from "@/components/product/product-card";
import { useFlashDeals } from "@/lib/hooks/use-products";
import { useState, useEffect } from "react";

export function FlashDealsSection() {
  const { data: deals = [], isLoading, error } = useFlashDeals();
  const [timeLeft, setTimeLeft] = useState("00:59:59");

  useEffect(() => {
    const end = Date.now() + 60 * 60 * 1000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return null;
  if (error || !deals.length) return null;

  return (
    <section className="relative overflow-hidden py-6 sm:py-12">
      {/* Golden shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-yellow-500/5 to-amber-600/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.yellow.400/0.08),transparent_70%)]" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" style={{ animationDuration: "3s" }} />
      </div>
      {/* Golden sparkle orbs */}
      <div className="absolute -left-4 -top-4 h-32 w-32 animate-pulse rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="absolute -bottom-4 -right-4 h-40 w-40 animate-pulse rounded-full bg-amber-500/10 blur-3xl" />
      {/* Top border glow */}
      <div className="absolute top-0 left-1/2 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
      <div className="absolute bottom-0 left-1/2 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4">
        <FadeIn className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 shadow-lg shadow-yellow-500/30">
              <Zap className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 text-amber-900" />
              <div className="absolute inset-0 animate-ping rounded-lg sm:rounded-xl bg-yellow-300/30" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold">
                <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  Flash Deals
                </span>
              </h2>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-300/70">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Limited time offer</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-2.5 py-1.5 sm:px-3 sm:py-2 ring-1 ring-yellow-400/30">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-300" />
            <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-yellow-200">
              {timeLeft}
            </span>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((p, i) => (
            <div
              key={p.id}
              className="animate-in animate-in-duration-500 animate-in-fade animate-in-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ProductCard product={p} badge="Golden Deal" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}