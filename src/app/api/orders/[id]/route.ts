import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: data });
}
