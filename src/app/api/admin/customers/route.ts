import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ customers: [] });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, role, loyalty_points, created_at, last_sign_in_at, updated_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("customers error:", error.code);
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }

  const customers = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.created_at,
    lastSignInAt: c.last_sign_in_at ?? null,
    updatedAt: c.updated_at ?? null,
    loyaltyPoints: c.loyalty_points ?? 0,
  }));

  return NextResponse.json({ customers });
}
