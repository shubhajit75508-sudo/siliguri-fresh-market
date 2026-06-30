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

function getAdminInStockProducts(): Product[] {
  return getAdminProducts().filter((p) => p.inStock);
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
  const admin = getAdminInStockProducts().filter((p) => p.category === category);
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
  const admin = getAdminInStockProducts().find((p) => p.slug === slug);
  return admin ?? null;
}

export async function getFlashDeals(): Promise<Product[]> {
  let products: Product[] = [];

  if (isSupabaseConfigured()) {
    try {
      const res = await fetch("/api/products/flash-deals");
      if (res.ok) {
        const dbProducts: Product[] = await res.json();
        products = [...products, ...dbProducts];
      }
    } catch {
      // API failed
    }
  }

  const admin = getAdminInStockProducts().filter((p) => p.isFlashDeal);
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
  const admin = getAdminInStockProducts().filter((p) => p.isTrending);
  if (!admin.length) return products;
  const adminIds = new Set(admin.map((p) => p.id));
  return [...admin, ...products.filter((p) => !adminIds.has(p.id))];
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      const dbResults = await db.searchProductsByQuery(query);
      const admin = getAdminInStockProducts().filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      const adminIds = new Set(admin.map((p) => p.id));
      return [...admin, ...dbResults.filter((p) => !adminIds.has(p.id))];
    } catch {}
  }
  const mockResults = mock.searchProducts(query);
  const admin = getAdminInStockProducts().filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );
  const adminIds = new Set(admin.map((p) => p.id));
  return [...admin, ...mockResults.filter((p) => !adminIds.has(p.id))];
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
