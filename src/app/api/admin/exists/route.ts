import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ exists: true });

  const supabaseAdmin = createClient(url, key);

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Admin exists check failed:", error.message);
    return NextResponse.json({ exists: true });
  }

  const hasAdmin = data.users.some(
    (u) => u.user_metadata?.role === "admin"
  );
  return NextResponse.json({ exists: hasAdmin });
}
