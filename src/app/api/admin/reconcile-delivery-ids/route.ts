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
  const { oldId, newId } = body;
  if (!oldId || !newId) return NextResponse.json({ error: "oldId and newId are required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ delivery_boy_id: newId })
    .eq("delivery_boy_id", oldId)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: data?.length ?? 0, orders: data ?? [] });
}
