import type { Product, CategoryInfo } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as db from "@/lib/supabase/queries";
import * as mock from "./products";
import { categories as mockCategories } from "./categories";

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchProductsByCategory(category);
  return mock.getProductsByCategory(category);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) return db.fetchProductBySlug(slug);
  return mock.getProductBySlug(slug) ?? null;
}

export async function getFlashDeals(): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchFlashDeals();
  return mock.getFlashDeals();
}

export async function getTrendingProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchTrendingProducts();
  return mock.getTrendingProducts();
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.searchProductsByQuery(query);
  return mock.searchProducts(query);
}

export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) return db.fetchAllProducts();
  return mock.products;
}

export async function getCategories(): Promise<CategoryInfo[]> {
  if (isSupabaseConfigured()) return db.fetchCategories();
  return mockCategories;
}
