"use client";

import { Zap, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
    <section className="relative py-6 sm:py-12 overflow-hidden">
      {/* Glowing background orb */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#F5A623]/8 blur-3xl animate-pulse" />
      <div className="absolute -bottom-8 left-1/4 w-48 h-48 rounded-full bg-[#F5A623]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Glowing top border */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#F5A623]/40 to-transparent" />

        <FadeIn className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zap icon with pulse ring */}
            <motion.div
              animate={{ boxShadow: ["0 0 0 0 rgba(245,166,35,0.4)", "0 0 0 8px rgba(245,166,35,0)", "0 0 0 0 rgba(245,166,35,0.4)"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#F5A623]/10"
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#F5A623]" />
              {/* Ping ring */}
              <span className="absolute inset-0 rounded-lg sm:rounded-xl animate-ping bg-[#F5A623]/10" />
            </motion.div>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-foreground">
                Flash Deals
              </h2>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-muted"
              >
                <Sparkles className="h-2.5 w-2.5 text-[#F5A623]" />
                <span>Limited time offer</span>
              </motion.div>
            </div>
          </div>

          {/* Animated countdown */}
          <motion.div
            animate={{ boxShadow: ["0 0 0 0 rgba(245,166,35,0.2)", "0 0 0 4px rgba(245,166,35,0)", "0 0 0 0 rgba(245,166,35,0.2)"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-1.5 rounded-lg bg-[#F5A623]/10 px-2.5 py-1.5 sm:px-3 sm:py-2 ring-1 ring-[#F5A623]/20"
          >
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#F5A623]" />
            <motion.span
              animate={{ textShadow: ["0 0 0 rgba(245,166,35,0)", "0 0 8px rgba(245,166,35,0.4)", "0 0 0 rgba(245,166,35,0)"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="font-mono tabular-nums text-xs sm:text-sm font-bold text-[#B87A0A]"
            >
              {timeLeft}
            </motion.span>
          </motion.div>
        </FadeIn>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            >
              <ProductCard product={p} badge="Flash Deal" />
            </motion.div>
          ))}
        </div>

        {/* Glowing bottom border */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#F5A623]/30 to-transparent" />
      </div>
    </section>
  );
}
