"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { useSearchProducts, useTrendingProducts, useProducts } from "@/lib/hooks/use-products";

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
        <div className="mt-16 flex flex-col items-center text-center">
          <Search className="mb-4 h-12 w-12 text-muted" />
          <h3 className="text-lg font-semibold">No results found</h3>
          <p className="mt-1 text-sm text-muted">
            Try searching for fish, chicken, vegetables, or fruits
          </p>
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
