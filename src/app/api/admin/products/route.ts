import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();
  const { error } = await supabaseAdmin.from("products").insert({
    id: body.id,
    slug: body.slug,
    name: body.name ?? "",
    description: body.description ?? "",
    category: body.category,
    price: body.price,
    original_price: body.originalPrice ?? null,
    discount: body.discount ?? 0,
    image: body.image ?? "",
    images: body.images ?? null,
    unit: body.unit || "kg",
    stock: body.stock ?? null,
    freshness_score: body.freshnessScore ?? 100,
    delivery_eta: body.deliveryEta ?? 30,
    rating: body.rating ?? 0,
    review_count: body.reviewCount ?? 0,
    in_stock: body.inStock ?? true,
    is_flash_deal: body.isFlashDeal ?? false,
    is_trending: body.isTrending ?? false,
    tags: body.tags ?? null,
    weight: body.weight ?? null,
    cuts: body.cuts ?? null,
    cleaning_options: body.cleaningOptions ?? null,
    nutrition: body.nutrition ?? null,
    source: body.source ?? null,
    species: body.species ?? null,
    river: body.river ?? null,
    catch_date: body.catchDate ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();
  const { id, ...updates } = body;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.originalPrice !== undefined) dbUpdates.original_price = updates.originalPrice;
  if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.freshnessScore !== undefined) dbUpdates.freshness_score = updates.freshnessScore;
  if (updates.deliveryEta !== undefined) dbUpdates.delivery_eta = updates.deliveryEta;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.reviewCount !== undefined) dbUpdates.review_count = updates.reviewCount;
  if (updates.isFlashDeal !== undefined) dbUpdates.is_flash_deal = updates.isFlashDeal;
  if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
  if (updates.cuts !== undefined) dbUpdates.cuts = updates.cuts;
  if (updates.cleaningOptions !== undefined) dbUpdates.cleaning_options = updates.cleaningOptions;
  if (updates.nutrition !== undefined) dbUpdates.nutrition = updates.nutrition;
  if (updates.source !== undefined) dbUpdates.source = updates.source;
  if (updates.species !== undefined) dbUpdates.species = updates.species;
  if (updates.river !== undefined) dbUpdates.river = updates.river;
  if (updates.catchDate !== undefined) dbUpdates.catch_date = updates.catchDate;

  const { error } = await supabaseAdmin.from("products").update(dbUpdates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id param" }, { status: 400 });

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
