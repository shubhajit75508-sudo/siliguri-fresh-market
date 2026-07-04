"use client";

import { ArrowUpDown, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "price-asc" | "price-desc" | "name" | "rating";

export interface ProductFiltersState {
  sort: SortOption;
  inStockOnly: boolean;
}

interface Props {
  total: number;
  filtered: number;
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
}

const sortLabels: Record<SortOption, string> = {
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  name: "Name: A to Z",
  rating: "Rating: High to Low",
};

export function ProductFilterBar({ total, filtered, filters, onChange }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">{filtered}</span>
        {" of "}
        <span>{total}</span> items
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
            filters.inStockOnly
              ? "border-brand-dark bg-brand-dark/10 text-brand-dark"
              : "border-border text-muted hover:border-brand-dark/30 hover:text-foreground"
          )}
        >
          <Check className={cn("h-3.5 w-3.5", filters.inStockOnly ? "opacity-100" : "opacity-0")} />
          In Stock Only
        </button>

        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
            className="appearance-none rounded-xl border border-border bg-surface px-8 py-1.5 pl-3 pr-8 text-xs font-medium text-muted outline-none transition-colors hover:border-brand-dark/30 hover:text-foreground focus:border-brand-dark"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        </div>
      </div>
    </div>
  );
}
