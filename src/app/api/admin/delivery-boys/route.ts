import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

export async function GET() {
  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ boys: [] });

  const { data, error } = await supabaseAdmin
    .from("delivery_boys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boys: data ?? [] });
}

export async function POST(req: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const body = await req.json();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name, phone: body.phone, role: "delivery" },
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const userId = authData.user.id;

  const { error: userError } = await supabaseAdmin.from("users").upsert({
    id: userId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    role: "delivery",
    loyalty_points: 0,
  });
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  const { error: dbError } = await supabaseAdmin.from("delivery_boys").upsert({
    id: userId,
    name: body.name,
    phone: body.phone,
    code: body.name.slice(0, 3).toUpperCase() + body.phone.slice(-3),
    is_active: true,
    area: body.area ?? "Siliguri",
  });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true, id: userId });
}

export async function DELETE(req: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await supabaseAdmin.from("delivery_boys").delete().eq("id", id);
  await supabaseAdmin.from("users").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
