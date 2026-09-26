"use client";

import { motion } from "framer-motion";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color?: string;
  /** Shown under the value; hides the delta pill when the caller has no history. */
  hint?: string;
}

export function StatCard({ title, value, change, icon: Icon, color = "bg-brand-dark", hint }: StatCardProps) {
  const isPositive = change >= 0;
  // A 0% change is not a signal, so it is shown as neutral rather than "up".
  const isFlat = change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="adm-panel group relative overflow-hidden p-4 transition-colors hover:border-[#ff7a1a]/40 sm:p-5"
    >
      {/* Warm wash that intensifies on hover, so the tile feels live. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#ff7a1a]/10 blur-2xl transition-all duration-500 group-hover:bg-[#ff7a1a]/20"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white", color)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold adm-num",
            isFlat
              ? "bg-white/5 text-[#98a2b0]"
              : isPositive
                ? "bg-[#22c55e]/12 text-[#4ade80]"
                : "bg-[#ef4444]/12 text-[#f87171]"
          )}
        >
          {isFlat ? null : isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isFlat ? "—" : `${Math.abs(change)}%`}
        </div>
      </div>

      <p className="adm-num relative mt-4 text-2xl font-extrabold tracking-tight sm:text-[28px]">{value}</p>
      <p className="relative mt-0.5 text-[13px] text-muted">{title}</p>
      {hint ? <p className="relative mt-2 text-[11px] text-muted-light">{hint}</p> : null}
    </motion.div>
  );
}
