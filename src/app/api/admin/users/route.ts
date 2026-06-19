import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { createClient } = await import("@supabase/supabase-js");
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
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
