import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const raw = cookie.value.includes(".") ? cookie.value.split(".")[0] : cookie.value;
  const [userId, role] = raw.split("|");
  if (!userId || role !== "delivery") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("rejected_by")
    .eq("id", orderId)
    .single();

  const rejectedBy: string[] = (existing?.rejected_by as string[]) ?? [];
  if (!rejectedBy.includes(userId)) {
    rejectedBy.push(userId);
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ rejected_by: rejectedBy })
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: "Failed to reject order" }, { status: 500 });
  return NextResponse.json({ success: true });
}
