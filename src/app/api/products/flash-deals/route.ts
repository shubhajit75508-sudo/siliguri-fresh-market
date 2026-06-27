import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types";

interface ProductRow {
  id: string; slug: string; name: string; description: string | null;
  category: string; price: number; original_price: number | null; discount: number | null;
  image: string | null; images: string[] | null; unit: string; stock: number | null;
  weight?: string[] | null; cuts: string[] | null; cleaning_options: string[] | null;
  freshness_score: number; delivery_eta: number; rating: number; review_count: number;
  in_stock: boolean; is_flash_deal: boolean | null; is_trending: boolean | null;
  tags: string[] | null; nutrition: Record<string, string> | null;
  source: string | null; species: string | null; river: string | null; catch_date: string | null;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id, slug: row.slug, name: row.name, description: row.description ?? "",
    category: row.category as Product["category"], price: row.price,
    originalPrice: row.original_price ?? undefined, discount: row.discount ?? undefined,
    image: row.image ?? "", images: row.images ?? undefined, unit: row.unit,
    stock: row.stock ?? undefined, weight: row.weight ?? undefined, cuts: row.cuts ?? undefined,
    cleaningOptions: row.cleaning_options ?? undefined,
    freshnessScore: row.freshness_score, deliveryEta: row.delivery_eta,
    rating: Number(row.rating) || 4.5, reviewCount: row.review_count || 0,
    inStock: row.in_stock, isFlashDeal: row.is_flash_deal ?? undefined,
    isTrending: row.is_trending ?? undefined, tags: row.tags ?? undefined,
    nutrition: row.nutrition ?? undefined,
    source: row.source ?? undefined, species: row.species ?? undefined,
    river: row.river ?? undefined, catchDate: row.catch_date ?? undefined,
  };
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("is_flash_deal", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row: ProductRow) => mapProduct(row)));
}
