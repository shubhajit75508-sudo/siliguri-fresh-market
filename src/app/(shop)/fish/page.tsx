"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { ProductFilterBar, type ProductFiltersState } from "@/components/product/product-filter-bar";
import { FISH_SUBCATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

const FISH_FILTER_CHIPS = [
  { value: "all", label: "All" },
  ...FISH_SUBCATEGORIES.filter((s) => s.value !== "unassigned"),
];

export default function FishPage() {
  const { data: fish = [] } = useProductsByCategory("fish");
  const [filters, setFilters] = useState<ProductFiltersState>({ sort: "name", inStockOnly: false });
  const [subcat, setSubcat] = useState("all");

  const processed = useMemo(() => {
    let list = [...fish];
    if (subcat !== "all") {
      list = list.filter((p) => p.subcategory === subcat);
    }
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);
    switch (filters.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "rating": list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return list;
  }, [fish, filters, subcat]);

  return (
    <div className="py-6 sm:py-8">
      <div className="relative mb-10 overflow-hidden rounded-[32px] shadow-xl">
        <div className="relative min-h-[280px] sm:min-h-[320px]">
          <img src="https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299704/Picsart_26-06-24_11-09-55-236_cmcwt5.jpg"
            alt="Fresh fish"
            className="absolute inset-0 w-full h-full object-cover product-img"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div className="animate-in">
            <span className="inline-flex rounded-full bg-white/40 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-[#2D7D3A]">
              Premium Fish Experience
            </span>
            <h1 className="mt-3 text-[28px] font-bold tracking-tight text-white sm:text-[36px]">
              Today&apos;s Fresh Catch
            </h1>
            <p className="mt-2 max-w-md text-[14px] text-white/65">
              River & sea fish from Teesta and Mahananda — choose your cut, cleaned to order.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max pb-1">
          {FISH_FILTER_CHIPS.map((chip) => {
            const count = chip.value === "all"
              ? fish.length
              : fish.filter((p) => p.subcategory === chip.value).length;
            return (
              <button
                key={chip.value}
                onClick={() => setSubcat(chip.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all min-h-[44px] whitespace-nowrap",
                  subcat === chip.value
                    ? "border-[#2D7D3A] bg-[#2D7D3A] text-white shadow-lg shadow-[#2D7D3A]/25"
                    : "border-border bg-surface text-muted hover:border-[#2D7D3A]/40 hover:text-foreground"
                )}
              >
                {chip.label}
                {chip.value !== "all" && (
                  <span className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    subcat === chip.value ? "bg-white/20 text-white" : "bg-muted/10 text-muted"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ProductFilterBar
        total={fish.length}
        filtered={processed.length}
        filters={filters}
        onChange={setFilters}
      />

      {processed.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {processed.map((p, i) => (
            <div key={p.id} className={`animate-in animate-in-d${Math.min(i + 1, 10)}`}>
              <ProductCard product={p} badge="Fresh Catch" />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted">
            {subcat !== "all"
              ? `No products tagged as "${FISH_SUBCATEGORIES.find((s) => s.value === subcat)?.label ?? subcat}" yet. Check back soon!`
              : "No products match your filters."}
          </p>
        </div>
      )}
    </div>
  );
}