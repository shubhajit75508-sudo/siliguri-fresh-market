import type { Product, CategoryInfo } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as db from "@/lib/supabase/queries";
import * as mock from "./products";
import { categories as mockCategories } from "./categories";
import { useAdminStore } from "@/store/admin-store";

function getAdminProducts(): Product[] {
  try {
    return useAdminStore.getState().products ?? [];
  } catch {
    return [];
  }
}

function mergeWithAdmin(products: Product[]): Product[] {
  const admin = getAdminProducts();
  if (!admin.length) return products;
  const productIds = new Set(products.map((p) => p.id));
  const extraAdmin = admin.filter((p) => !productIds.has(p.id));
  return [...products, ...extraAdmin];
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      return await db.fetchProductsByCategory(category);
    } catch {
      // fall through to mock when DB unavailable
    }
  }
  const mockProducts = mock.getProductsByCategory(category);
  const admin = getAdminProducts().filter((p) => p.category === category);
  if (!admin.length) return mockProducts;
  const productIds = new Set(mockProducts.map((p) => p.id));
  return [...mockProducts, ...admin.filter((p) => !productIds.has(p.id))];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const dbProduct = await db.fetchProductBySlug(slug);
      if (dbProduct) return dbProduct;
    } catch {
      // Supabase failed, fall through to mock/admin
    }
  }
  const mockProduct = mock.getProductBySlug(slug);
  if (mockProduct) return mockProduct;
  const admin = getAdminProducts().find((p) => p.slug === slug);
  return admin ?? null;
}

export async function getFlashDeals(): Promise<Product[]> {
  let products: Product[] = [];

  if (isSupabaseConfigured()) {
    try {
      const res = await fetch("/api/products/flash-deals", { cache: "no-store" });
      if (res.ok) {
        const dbProducts: Product[] = await res.json();
        products = [...products, ...dbProducts];
      }
    } catch {
      // API failed
    }
  }

  // Only merge local admin flash deals when the DB returned none (offline/fallback).
  if (isSupabaseConfigured() && products.length > 0) return products;

  const admin = getAdminProducts().filter((p) => p.isFlashDeal);
  if (admin.length) {
    const productIds = new Set(products.map((p) => p.id));
    products = [...products, ...admin.filter((p) => !productIds.has(p.id))];
  }

  return products;
}

export async function getTrendingProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      return await db.fetchTrendingProducts();
    } catch {
      // fall through to mock when DB unavailable
    }
  }
  const mockProducts = mock.getTrendingProducts();
  const admin = getAdminProducts().filter((p) => p.isTrending);
  if (!admin.length) return mockProducts;
  const productIds = new Set(mockProducts.map((p) => p.id));
  return [...mockProducts, ...admin.filter((p) => !productIds.has(p.id))];
}

function matchesQuery(p: Product, query: string): boolean {
  const q = query.toLowerCase();
  if (p.name.toLowerCase().includes(q)) return true;
  if (p.category.toLowerCase().includes(q)) return true;
  if (p.description?.toLowerCase().includes(q)) return true;
  if (p.species?.toLowerCase().includes(q)) return true;
  if (p.source?.toLowerCase().includes(q)) return true;
  if (p.tags?.some((t) => t.toLowerCase().includes(q))) return true;
  if (p.subcategory?.some((s) => s.toLowerCase().includes(q))) return true;
  return false;
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      // DB is the source of truth — admin-added products are persisted to the
      // products table too, so do NOT merge the local (localStorage) admin store.
      // Merging it here is what re-surfaced stale/deleted products as "random" results.
      return await db.searchProductsByQuery(query);
    } catch {
      // fall through to mock + admin store only when DB is unavailable
    }
  }
  const mockResults = mock.searchProducts(query);
  const admin = getAdminProducts().filter((p) => matchesQuery(p, query));
  const productIds = new Set(mockResults.map((p) => p.id));
  return [...mockResults, ...admin.filter((p) => !productIds.has(p.id))];
}

export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      // DB is the single source of truth when online; do not merge the
      // localStorage admin store (stale copies cause undeletable products).
      return await db.fetchAllProducts();
    } catch {}
  }
  return mergeWithAdmin(mock.products);
}

export async function getCategories(): Promise<CategoryInfo[]> {
  if (isSupabaseConfigured()) {
    try { return await db.fetchCategories(); } catch {}
  }
  return mockCategories;
}
