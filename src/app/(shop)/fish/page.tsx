"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { ProductFilterBar, type ProductFiltersState } from "@/components/product/product-filter-bar";

export default function FishPage() {
  const { data: fish = [] } = useProductsByCategory("fish");
  const [filters, setFilters] = useState<ProductFiltersState>({ sort: "name", inStockOnly: false });

  const processed = useMemo(() => {
    let list = [...fish];
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);
    switch (filters.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "rating": list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return list;
  }, [fish, filters]);

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
          <p className="text-muted">No products match your filters.</p>
        </div>
      )}
    </div>
  );
}