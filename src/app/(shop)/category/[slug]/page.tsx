"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { useCategories } from "@/lib/hooks/use-products";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { ProductFilterBar, type ProductFiltersState } from "@/components/product/product-filter-bar";
import { FISH_SUBCATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

const FISH_FILTER_CHIPS = [
  { value: "all", label: "All" },
  ...FISH_SUBCATEGORIES.filter((s) => s.value !== "unassigned"),
];

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: products = [], isLoading: prodsLoading } = useProductsByCategory(slug);
  const hydrated = useHydrated();

  const [filters, setFilters] = useState<ProductFiltersState>({ sort: "name", inStockOnly: false });
  const [subcat, setSubcat] = useState("all");
  const isFish = slug === "fish";

  const processed = useMemo(() => {
    let list = [...products];

    if (isFish && subcat !== "all") {
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
  }, [products, filters, subcat, isFish]);

  const category = categories.find((c) => c.slug === slug);
  if (hydrated && !catsLoading && !category) notFound();

  if (!hydrated || catsLoading || prodsLoading) {
    return (
      <div className="py-6 space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-4 w-72 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category!.name + " - Buy Online in Siliguri",
    description: category!.description,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: "https://www.siligurifreshmart.com/product/" + p.slug,
      name: p.name,
      image: p.image,
    })),
  };

  return (
    <div className="py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <div className="mb-8">
        <span className="text-3xl">{category!.icon}</span>
        <h1 className="mt-2 text-2xl font-extrabold">{category!.name}</h1>
        <p className="mt-1 text-sm text-muted">{category!.description}</p>
      </div>

      {isFish && (
        <div className="mb-5 -mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 min-w-max pb-1">
            {FISH_FILTER_CHIPS.map((chip) => {
              const count = chip.value === "all"
                ? products.length
                : products.filter((p) => p.subcategory === chip.value).length;
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
      )}

      <ProductFilterBar
        total={products.length}
        filtered={processed.length}
        filters={filters}
        onChange={setFilters}
      />

      {processed.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
