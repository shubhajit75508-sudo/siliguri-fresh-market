import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [userId, role] = cookie.value.split("|");
  if (!userId || role !== "delivery") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("delivery_boy_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
