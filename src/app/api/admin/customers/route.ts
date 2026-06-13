import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ customers: [] });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, role, loyalty_points, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data ?? [] });
}
