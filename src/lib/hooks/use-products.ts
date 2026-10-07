import { useQuery } from "@tanstack/react-query";
import * as data from "@/lib/data";

/**
 * Catalog reads are cached for a few minutes and never refetch on window
 * focus. Previously these used `staleTime: 0`, which combined with React
 * Query's default `refetchOnWindowFocus: true` re-downloaded the full product
 * list on every route change and every tab switch — a large part of why
 * browsing felt sluggish on slow connections.
 *
 * Admin screens manage catalog mutations through their own
 * `/api/admin/products` queries and invalidations, so they are unaffected.
 */
const CATALOG_STALE_TIME = 5 * 60 * 1000;
const catalogOptions = {
  staleTime: CATALOG_STALE_TIME,
  refetchOnWindowFocus: false,
} as const;

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: data.getAllProducts,
    ...catalogOptions,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => data.getProductBySlug(slug),
    enabled: !!slug,
    ...catalogOptions,
  });
}

/**
 * `limit` is folded into the query key: category pages fetch the whole
 * category while the home page only ever renders the first few cards, so the
 * two must not share a cache entry (an unlimited fetch would evict the small
 * one and vice-versa).
 */
export function useProductsByCategory(category: string, limit?: number) {
  return useQuery({
    queryKey: limit
      ? ["products", "category", category, limit]
      : ["products", "category", category],
    queryFn: () => data.getProductsByCategory(category, limit),
    enabled: !!category,
    ...catalogOptions,
  });
}

export function useFlashDeals() {
  return useQuery({
    queryKey: ["products", "flash-deals"],
    queryFn: data.getFlashDeals,
    ...catalogOptions,
  });
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ["products", "trending"],
    queryFn: data.getTrendingProducts,
    ...catalogOptions,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => data.searchProducts(query),
    enabled: query.length >= 2,
    // Short window: search should stay responsive as stock moves, but
    // backspacing through a query must not fire a request per keystroke.
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: data.getCategories,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

