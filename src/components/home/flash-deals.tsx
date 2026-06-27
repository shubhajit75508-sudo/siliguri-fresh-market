"use client";

import { Zap, Clock } from "lucide-react";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { ProductCard } from "@/components/product/product-card";
import { useFlashDeals } from "@/lib/hooks/use-products";
import { useState, useEffect } from "react";

export function FlashDealsSection() {
  const { data: deals = [], isLoading, error } = useFlashDeals();
  const [timeLeft, setTimeLeft] = useState("05:59:59");

  useEffect(() => {
    const end = Date.now() + 6 * 60 * 60 * 1000;
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
      <div className="absolute inset-0 bg-gradient-to-br from-brand-red/[0.07] via-brand-orange/[0.04] to-amber-500/[0.07]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.brand.orange/0.06),transparent_70%)]" />
      <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-red/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4">
        <FadeIn className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-red to-brand-orange shadow-lg shadow-brand-red/25">
              <Zap className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <div className="absolute inset-0 animate-ping rounded-lg sm:rounded-xl bg-brand-red/20" />
            </div>
            <h2 className="text-base sm:text-xl font-extrabold">
              <span className="bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
                Flash Deals
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-brand-red/10 px-2.5 py-1.5 sm:px-3 sm:py-2">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-brand-red" />
            <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-brand-red">
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
              <ProductCard product={p} badge="Flash Deal" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}