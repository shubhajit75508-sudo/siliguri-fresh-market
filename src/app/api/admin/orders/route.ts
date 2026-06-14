import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  console.log("[API] GET /api/admin/orders called");
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error("[API] Supabase not configured (missing env vars)");
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Supabase query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log("[API] Returning", data?.length ?? 0, "orders");
  return NextResponse.json({ orders: data ?? [] });
}

export async function PUT(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();
  const { id, ...updates } = body;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.delivery_status !== undefined) dbUpdates.delivery_status = updates.delivery_status;
  if (updates.delivery_boy_id !== undefined) dbUpdates.delivery_boy_id = updates.delivery_boy_id;
  if (updates.return_requested !== undefined) dbUpdates.return_requested = updates.return_requested;
  if (updates.return_approved !== undefined) dbUpdates.return_approved = updates.return_approved;

  const { error } = await supabaseAdmin.from("orders").update(dbUpdates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();
  const { error } = await supabaseAdmin.from("orders").upsert({
    id: body.id,
    user_id: body.user_id ?? null,
    items: body.items ?? [],
    total: body.total,
    status: body.status ?? "received",
    delivery_status: body.delivery_status ?? "pending",
    payment_method: body.payment_method ?? "cod",
    payment_status: body.payment_status ?? "unpaid",
    address_snapshot: body.address_snapshot ?? {},
    customer_name: body.customer_name ?? "",
    customer_phone: body.customer_phone ?? "",
    customer_email: body.customer_email ?? "",
    delivery_boy_id: body.delivery_boy_id ?? null,
    return_requested: body.return_requested ?? false,
    return_approved: body.return_approved ?? false,
    created_at: body.created_at ?? new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
