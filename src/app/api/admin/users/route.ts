import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addLocalUser } from "@/lib/local-db";

export async function POST(req: NextRequest) {

  const body = await req.json();

  addLocalUser({
    id: body.id,
    name: body.name,
    email: body.email,
    phone: body.phone ?? "",
    role: body.role ?? "customer",
    createdAt: new Date().toISOString(),
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ success: true, source: "local" });
  }

  const supabaseAdmin = createClient(url, key);

  const { error } = await supabaseAdmin.from("users").upsert({
    id: body.id,
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    role: body.role ?? "customer",
    loyalty_points: body.loyalty_points ?? 0,
    avatar: body.avatar ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, source: "supabase" });
}
