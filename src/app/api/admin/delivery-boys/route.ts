import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function checkAuth(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey === process.env.API_SECRET_KEY) return null;

  const cookie = req.cookies.get("sfm-auth-session");
  if (cookie?.value) {
    const [, role] = cookie.value.split("|");
    if (role === "admin") return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ boys: [] });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, phone, email, role, avatar")
    .eq("role", "delivery");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boys: data ?? [] });
}

export async function POST(req: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const supabaseAdmin = createClient(url, key);
  const body = await req.json();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name, phone: body.phone, role: "delivery" },
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const { error: dbError } = await supabaseAdmin.from("users").upsert({
    id: authData.user.id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    role: "delivery",
    loyalty_points: 0,
  });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true, id: authData.user.id });
}
