"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { ProductFilterBar, type ProductFiltersState } from "@/components/product/product-filter-bar";
import { FISH_SUBCATEGORIES } from "@/types";
import { cn } from "@/lib/utils";
import { Waves, Fish, Anchor, Shell, Sparkles, Grid3X3 } from "lucide-react";

const SUBCAT_ICONS: Record<string, React.ReactNode> = {
  all: <Grid3X3 className="h-5 w-5" />,
  river: <Waves className="h-5 w-5" />,
  sea: <Anchor className="h-5 w-5" />,
  hilsa: <Fish className="h-5 w-5" />,
  prawns: <Shell className="h-5 w-5" />,
  small: <Fish className="h-4 w-4" />,
  exotic: <Sparkles className="h-5 w-5" />,
  other: <Fish className="h-5 w-5" />,
};

const SUBCAT_IMAGES: Record<string, string> = {
  river: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1782299704/Picsart_26-06-24_11-09-55-236_cmcwt5.jpg",
  sea: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803563/1000020357_lq3qjy.jpg",
  hilsa: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803634/1000020362_bxnhvf.jpg",
  prawns: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803710/1000020363_f8wkjv.jpg",
  small: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803776/1000020364_kx9z2p.jpg",
  exotic: "https://res.cloudinary.com/dc5fh5afb/image/upload/w_120,h_120,c_fill,q_80/v1750803844/1000020365_r3t8qn.jpg",
};

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

  const chipOptions = [
    { value: "all", label: "All" },
    ...FISH_SUBCATEGORIES.filter((s) => s.value !== "unassigned"),
  ];

  return (
    <div className="py-6 sm:py-8">
      {/* Hero Banner */}
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

      {/* Subcategory Filter Cards */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-3 min-w-max pb-2">
          {/* All Card */}
          <button
            onClick={() => setSubcat("all")}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3 transition-all min-h-[44px] min-w-[88px] shrink-0",
              subcat === "all"
                ? "border-[#2D7D3A] bg-[#2D7D3A]/10 shadow-lg shadow-[#2D7D3A]/15"
                : "border-border bg-surface hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5"
            )}
          >
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl transition-all",
              subcat === "all"
                ? "bg-[#2D7D3A] text-white shadow-md shadow-[#2D7D3A]/30"
                : "bg-[#2D7D3A]/10 text-[#2D7D3A] group-hover:bg-[#2D7D3A]/15"
            )}>
              {SUBCAT_ICONS.all}
            </div>
            <span className={cn(
              "text-[11px] font-bold whitespace-nowrap",
              subcat === "all" ? "text-[#2D7D3A]" : "text-muted group-hover:text-foreground"
            )}>
              All
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
              subcat === "all" ? "bg-[#2D7D3A] text-white" : "bg-muted/10 text-muted"
            )}>
              {fish.length}
            </span>
          </button>

          {/* Category Cards */}
          {FISH_SUBCATEGORIES.filter((s) => s.value !== "unassigned").map((sub) => {
            const count = fish.filter((p) => p.subcategory === sub.value).length;
            const img = SUBCAT_IMAGES[sub.value];
            return (
              <button
                key={sub.value}
                onClick={() => setSubcat(sub.value)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3 transition-all min-h-[44px] min-w-[88px] shrink-0",
                  subcat === sub.value
                    ? "border-[#2D7D3A] bg-[#2D7D3A]/10 shadow-lg shadow-[#2D7D3A]/15"
                    : "border-border bg-surface hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5"
                )}
              >
                {img ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl shadow-sm">
                    <img
                      src={img}
                      alt={sub.label}
                      className={cn(
                        "h-full w-full object-cover transition-all",
                        subcat === sub.value ? "brightness-110 saturate-110" : "group-hover:brightness-105"
                      )}
                    />
                    <div className={cn(
                      "absolute inset-0 rounded-xl transition-all",
                      subcat === sub.value ? "ring-2 ring-[#2D7D3A] ring-offset-1" : ""
                    )} />
                  </div>
                ) : (
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl transition-all",
                    subcat === sub.value
                      ? "bg-[#2D7D3A] text-white shadow-md shadow-[#2D7D3A]/30"
                      : "bg-[#2D7D3A]/10 text-[#2D7D3A] group-hover:bg-[#2D7D3A]/15"
                  )}>
                    {SUBCAT_ICONS[sub.value] ?? <Fish className="h-5 w-5" />}
                  </div>
                )}
                <span className={cn(
                  "text-[11px] font-bold whitespace-nowrap",
                  subcat === sub.value ? "text-[#2D7D3A]" : "text-muted group-hover:text-foreground"
                )}>
                  {sub.label}
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
                  subcat === sub.value ? "bg-[#2D7D3A] text-white" : "bg-muted/10 text-muted"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort + Filter Bar */}
      <ProductFilterBar
        total={fish.length}
        filtered={processed.length}
        filters={filters}
        onChange={setFilters}
      />

      {/* Product Grid */}
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
