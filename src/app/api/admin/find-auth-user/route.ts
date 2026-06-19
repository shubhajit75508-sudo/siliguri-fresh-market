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

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email query param required" }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const user = data?.users?.find((u) => u.email === email);
    if (!user) return NextResponse.json({ id: null });
    return NextResponse.json({ id: user.id, email: user.email, name: user.user_metadata?.name, phone: user.user_metadata?.phone });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
