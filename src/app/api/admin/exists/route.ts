import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ exists: false });

  const supabaseAdmin = createClient(url, key);
  const { count, error } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    console.error("Admin exists check failed:", error.message);
    return NextResponse.json({ exists: true });
  }

  return NextResponse.json({ exists: (count ?? 0) > 0 });
}
