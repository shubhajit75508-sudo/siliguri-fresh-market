import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const { addLocalUser } = await import("@/lib/local-db");
      addLocalUser({
        id: body.id,
        name: body.name,
        email: body.email,
        phone: body.phone ?? "",
        role: body.role ?? "customer",
        createdAt: new Date().toISOString(),
      });
    } catch {
      // local-db is a non-critical fallback; fine if it fails on Vercel
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, key);

    const { error } = await supabaseAdmin.from("users").upsert({
      id: body.id,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      role: body.role ?? "customer",
      loyalty_points: body.loyalty_points ?? 0,
    });

    if (error) {
      console.error("users upsert error:", error.code);
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("users error:", err);
    return NextResponse.json({ error: "User creation failed" }, { status: 500 });
  }
}
