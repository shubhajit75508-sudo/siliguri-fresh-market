import type { Product, CategoryInfo } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as db from "@/lib/supabase/queries";
import * as mock from "./products";
import { categories as mockCategories } from "./categories";

function getAdminProducts(): Product[] {
  try {
    const { useAdminStore } = require("@/store/admin-store");
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
  if (isSupabaseConfigured()) return db.fetchProductsByCategory(category);
  return mergeWithAdmin(mock.getProductsByCategory(category));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) return db.fetchProductBySlug(slug);
  const mockProduct = mock.getProductBySlug(slug);
  if (mockProduct) return mockProduct;
  const admin = getAdminProducts().find((p) => p.slug === slug);
  return admin ?? null;
}

export async function getFlashDeals(): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchFlashDeals();
  return mergeWithAdmin(mock.getFlashDeals());
}

export async function getTrendingProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchTrendingProducts();
  return mergeWithAdmin(mock.getTrendingProducts());
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.searchProductsByQuery(query);
  return mergeWithAdmin(mock.searchProducts(query));
}

export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchAllProducts();
  return mergeWithAdmin(mock.products);
}

export async function getCategories(): Promise<CategoryInfo[]> {
  if (isSupabaseConfigured()) return db.fetchCategories();
  return mockCategories;
}
