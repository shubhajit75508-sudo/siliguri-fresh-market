"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { CategoriesSection } from "@/components/home/categories-section";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { useSearchProducts, useTrendingProducts, useProducts } from "@/lib/hooks/use-products";
import { fbq } from "@/components/analytics/meta-pixel";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { data: results = [] } = useSearchProducts(query);
  const { data: trending = [] } = useTrendingProducts();
  const { data: allProducts = [] } = useProducts();
  const browseProducts = query ? results : (trending.length > 0 ? trending : allProducts);

  useEffect(() => {
    if (query) {
      fbq("Search", { search_string: query });
    }
  }, [query]);

  return (
    <div className="py-6">
      <FadeIn>
        <div className="mb-1 flex items-center gap-2.5">
          <span className="section-header-accent h-[26px]" />
          <h1 className="text-lg font-extrabold tracking-tight sm:text-2xl">
            {query ? (
              <>
                Results for &ldquo;{query}&rdquo;
              </>
            ) : (
              <>Browse Products</>
            )}
          </h1>
        </div>
        <p className="text-sm text-muted">
          {query ? (
            <span className="font-semibold text-[#23682E]">{results.length} item{results.length === 1 ? "" : "s"} found</span>
          ) : (
            trending.length > 0 ? "Trending picks — or search for something specific" : "All products — or search for something specific"
          )}
        </p>
      </FadeIn>

      {!query && (
        <div className="mt-1">
          <CategoriesSection />
        </div>
      )}

      {browseProducts.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {browseProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center text-center">
          <Search className="mb-4 h-12 w-12 text-muted" />
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="mt-1 text-sm text-muted">
            Try searching for fish, chicken, vegetables, or fruits
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-6 text-muted text-sm">Loading products...</div>}>
      <SearchResults />
    </Suspense>
  );
}
