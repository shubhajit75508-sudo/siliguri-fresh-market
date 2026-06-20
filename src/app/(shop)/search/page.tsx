"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search, Fish, Beef, Apple, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { useSearchProducts, useTrendingProducts, useProducts } from "@/lib/hooks/use-products";
import { categories as allCats } from "@/lib/data/categories";
import type { CategoryInfo } from "@/types";

const categoryIcons: Record<string, React.ReactNode> = {
  fish: <Fish className="h-4 w-4" />,
  chicken: <Beef className="h-4 w-4" />,
  mutton: <Beef className="h-4 w-4" />,
  vegetables: <Apple className="h-4 w-4" />,
  fruits: <Apple className="h-4 w-4" />,
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { data: results = [] } = useSearchProducts(query);
  const { data: trending = [] } = useTrendingProducts();
  const { data: allProducts = [] } = useProducts();
  const browseProducts = query ? results : trending;

  return (
    <div className="py-6">
      <FadeIn>
        <h1 className="text-xl font-extrabold sm:text-2xl">
          {query ? (
            <>
              Results for &ldquo;{query}&rdquo;
              <span className="ml-2 text-base font-normal text-muted">
                ({results.length} items)
              </span>
            </>
          ) : (
            <>
              Browse Products
              <span className="ml-2 text-base font-normal text-muted">
                ({allProducts.length} items)
              </span>
            </>
          )}
        </h1>
        {!query && (
          <p className="mt-1 text-sm text-muted">Trending picks — or search for something specific</p>
        )}
      </FadeIn>

      {browseProducts.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {browseProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : query ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <Search className="h-7 w-7 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">No results found</h3>
          <p className="mt-1 text-sm text-muted max-w-xs">
            We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try browsing a category instead.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {allCats.map((cat: CategoryInfo) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:border-brand-fresh/40 hover:bg-brand-fresh/[0.03] hover:shadow-md"
              >
                {categoryIcons[cat.slug] || <ShoppingBag className="h-4 w-4" />}
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-6 skeleton h-8 w-48 rounded-xl" />}>
      <SearchResults />
    </Suspense>
  );
}
