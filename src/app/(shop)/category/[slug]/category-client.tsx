"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Product, CategoryInfo } from "@/types";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilterBar, type ProductFiltersState } from "@/components/product/product-filter-bar";

export function CategoryClient({ slug, category, products }: { slug: string; category: CategoryInfo | null; products: Product[] }) {
  const router = useRouter();

  const [filters, setFilters] = useState<ProductFiltersState>({ sort: "name", inStockOnly: false });

  const processed = useMemo(() => {
    let list = [...products];
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);
    switch (filters.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "rating": list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return list;
  }, [products, filters]);

  if (!category) {
    router.replace("/");
    return null;
  }

  return (
    <div className="py-3 sm:py-5">
      <div className="storefront-panel mb-4 flex items-center gap-3.5 p-4 sm:p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D7D3A]/12 to-[#F5A623]/12 text-3xl">
          {category.icon}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{category.name}</h1>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted sm:text-sm">{category.description}</p>
        </div>
      </div>

      <ProductFilterBar
        total={products.length}
        filtered={processed.length}
        filters={filters}
        onChange={setFilters}
      />

      {processed.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {processed.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted">No products match your filters.</p>
        </div>
      )}

      <button onClick={() => router.push("/")} className="mt-8 text-sm text-brand-blue hover:underline">
        ← Back to Home
      </button>
    </div>
  );
}
