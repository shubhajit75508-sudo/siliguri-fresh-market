"use client";

import { Zap, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
      {/* Big glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#F5A623]/12 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute -bottom-16 right-1/4 w-64 h-64 rounded-full bg-[#F5A623]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Gold shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#F5A623]/8 to-transparent"
          />
        </div>

        {/* Glow ring border */}
        <motion.div
          animate={{ boxShadow: [
            "0 0 0 1px rgba(245,166,35,0.15), 0 0 20px rgba(245,166,35,0.08)",
            "0 0 0 1px rgba(245,166,35,0.3), 0 0 40px rgba(245,166,35,0.15)",
            "0 0 0 1px rgba(245,166,35,0.15), 0 0 20px rgba(245,166,35,0.08)",
          ]}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-3xl px-2 py-3 sm:px-4 sm:py-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Zap icon with double ping */}
              <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E8960A] shadow-lg shadow-[#F5A623]/30">
                <span className="absolute inset-0 rounded-xl animate-ping bg-[#F5A623]/30" style={{ animationDuration: "1.5s" }} />
                <Zap className="relative z-10 h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-extrabold text-foreground">
                  Flash Deals
                </h2>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-muted"
                >
                  <Sparkles className="h-2.5 w-2.5 text-[#F5A623]" />
                  <span>Limited time offer</span>
                </motion.div>
              </div>
            </div>

            {/* Glowing countdown pill */}
            <motion.div
              animate={{ boxShadow: [
                "0 0 0 0 rgba(245,166,35,0.3)",
                "0 0 0 6px rgba(245,166,35,0)",
                "0 0 0 0 rgba(245,166,35,0.3)",
              ]}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F5A623]/15 to-[#E8960A]/15 px-3 py-1.5 sm:px-4 sm:py-2 ring-1 ring-[#F5A623]/30"
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F5A623]" />
              </motion.span>
              <motion.span
                animate={{ textShadow: [
                  "0 0 0px rgba(245,166,35,0)",
                  "0 0 12px rgba(245,166,35,0.5)",
                  "0 0 0px rgba(245,166,35,0)",
                ]}}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="font-mono tabular-nums text-xs sm:text-sm font-bold text-[#B87A0A]"
              >
                {timeLeft}
              </motion.span>
            </motion.div>
          </div>

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
        </motion.div>
      </div>
    </section>
  );
}
