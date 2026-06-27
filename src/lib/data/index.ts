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
  const adminIds = new Set(admin.map((p) => p.id));
  return [...admin, ...products.filter((p) => !adminIds.has(p.id))];
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  let products: Product[];
  if (isSupabaseConfigured()) {
    try { products = await db.fetchProductsByCategory(category); } catch { products = mock.getProductsByCategory(category); }
  } else {
    products = mock.getProductsByCategory(category);
  }
  const admin = getAdminProducts().filter((p) => p.category === category);
  if (!admin.length) return products;
  const adminIds = new Set(admin.map((p) => p.id));
  return [...admin, ...products.filter((p) => !adminIds.has(p.id))];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    const dbProduct = await db.fetchProductBySlug(slug);
    if (dbProduct) return dbProduct;
  }
  const mockProduct = mock.getProductBySlug(slug);
  if (mockProduct) return mockProduct;
  const admin = getAdminProducts().find((p) => p.slug === slug);
  return admin ?? null;
}

export async function getFlashDeals(): Promise<Product[]> {
  // Start with mock flash deals as a guaranteed baseline
  let products: Product[] = [...mock.getFlashDeals()];

  // Overlay Supabase flash deals via server API (uses service role key)
  if (isSupabaseConfigured()) {
    try {
      const res = await fetch("/api/products/flash-deals");
      if (res.ok) {
        const dbProducts: Product[] = await res.json();
        const dbIds = new Set(dbProducts.map((p) => p.id));
        products = [...dbProducts, ...products.filter((p) => !dbIds.has(p.id))];
      }
    } catch {
      // API failed, keep mock data
    }
  }

  // Overlay admin store flash deals (replaces any with same IDs)
  const admin = getAdminProducts().filter((p) => p.isFlashDeal);
  if (admin.length) {
    const adminIds = new Set(admin.map((p) => p.id));
    products = [...admin, ...products.filter((p) => !adminIds.has(p.id))];
  }

  return products;
}

export async function getTrendingProducts(): Promise<Product[]> {
  let products: Product[];
  if (isSupabaseConfigured()) {
    try { products = await db.fetchTrendingProducts(); } catch { products = []; }
  } else {
    products = mock.getTrendingProducts();
  }
  const admin = getAdminProducts().filter((p) => p.isTrending);
  if (!admin.length) return products;
  const adminIds = new Set(admin.map((p) => p.id));
  return [...admin, ...products.filter((p) => !adminIds.has(p.id))];
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try { return await db.searchProductsByQuery(query); } catch {}
  }
  return mergeWithAdmin(mock.searchProducts(query));
}

export async function getAllProducts(): Promise<Product[]> {
  let products: Product[];
  if (isSupabaseConfigured()) {
    try { products = await db.fetchAllProducts(); } catch { products = mock.products; }
  } else {
    products = mock.products;
  }
  return mergeWithAdmin(products);
}

export async function getCategories(): Promise<CategoryInfo[]> {
  if (isSupabaseConfigured()) {
    try { return await db.fetchCategories(); } catch {}
  }
  return mockCategories;
}
