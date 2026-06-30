import { useQuery } from "@tanstack/react-query";
import * as data from "@/lib/data";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: data.getAllProducts,
    staleTime: 0,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => data.getProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: ["products", "category", category],
    queryFn: () => data.getProductsByCategory(category),
    enabled: !!category,
  });
}

export function useFlashDeals() {
  return useQuery({
    queryKey: ["products", "flash-deals"],
    queryFn: data.getFlashDeals,
    staleTime: 0,
  });
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ["products", "trending"],
    queryFn: data.getTrendingProducts,
    staleTime: 0,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => data.searchProducts(query),
    enabled: query.length >= 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: data.getCategories,
    staleTime: 30 * 60 * 1000,
  });
}
