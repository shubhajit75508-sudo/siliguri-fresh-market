import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie?.value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [userId] = cookie.value.split("|");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
