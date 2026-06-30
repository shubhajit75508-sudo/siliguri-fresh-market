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
    <section className="relative overflow-hidden rounded-2xl glass-panel py-6 sm:py-12 mx-4 sm:mx-0">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <FadeIn className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#E8A440]/15">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#E8A440]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-white">
                Flash Deals
              </h2>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/40">
                <Sparkles className="h-2.5 w-2.5 text-[#E8A440]" />
                <span>Limited time offer</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-[#E8A440]/10 px-2.5 py-1.5 sm:px-3 sm:py-2 ring-1 ring-[#E8A440]/20">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#E8A440]" />
            <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-[#E8A440]">
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
