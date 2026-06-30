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
}

export function StatCard({ title, value, change, icon: Icon, color = "bg-brand-dark" }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-surface p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-green-600" : "text-red-500"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted">{title}</p>
    </motion.div>
  );
}
