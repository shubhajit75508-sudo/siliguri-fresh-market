import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// POST /api/admin/payment — admin confirms a direct UPI payment
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { order_id } = await req.json();
  if (!order_id) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", order_id);

  if (error) {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
