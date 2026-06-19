import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

async function resolveBoyId(supabaseAdmin: any, boyId: string, boyEmail?: string): Promise<string> {
  if (!boyId.startsWith("auth-") || !boyEmail) return boyId;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error || !data?.users) return boyId;
    const user = data.users.find((u: { email: string }) => u.email === boyEmail);
    if (user) return user.id;
  } catch {}
  return boyId;
}

export async function PUT(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();
  const { id, ...updates } = body;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.delivery_status !== undefined) dbUpdates.delivery_status = updates.delivery_status;
  if (updates.delivery_boy_id !== undefined) {
    dbUpdates.delivery_boy_id = await resolveBoyId(supabaseAdmin, updates.delivery_boy_id, updates.delivery_boy_email);
  }
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
    user_id: null,
    items: body.items ?? [],
    total: body.total,
    status: body.status ?? "received",
    delivery_status: body.delivery_status ?? "pending",
    payment_method: body.payment_method ?? "cod",
    address_snapshot: body.address_snapshot ?? {},
    customer_name: body.customer_name ?? "",
    customer_phone: body.customer_phone ?? "",
    customer_email: body.customer_email ?? "",
    delivery_boy_id: body.delivery_boy_id ?? null,
    return_requested: body.return_requested ?? false,
    return_approved: body.return_approved ?? false,
    created_at: body.created_at ?? new Date().toISOString(),
    eta: body.eta ?? 30,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
