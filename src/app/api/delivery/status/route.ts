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
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie?.value) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const raw = cookie.value.includes(".") ? cookie.value.split(".")[0] : cookie.value;
  const [userId, role] = raw.split("|");
  if (!userId || role !== "delivery") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json();
  const { orderId, deliveryStatus, status, customerEmail } = body;
  if (!orderId || !deliveryStatus) return NextResponse.json({ error: "Missing orderId or deliveryStatus" }, { status: 400 });

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("delivery_boy_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.delivery_boy_id !== userId) return NextResponse.json({ error: "Order not assigned to you" }, { status: 403 });

  const dbUpdates: Record<string, unknown> = { delivery_status: deliveryStatus };
  if (status) dbUpdates.status = status;

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update(dbUpdates)
    .eq("id", orderId);

  if (updateError) {
    console.error("delivery status update error:", updateError.code);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  if (customerEmail) {
    const { sendDeliveryUpdate } = await import("@/lib/email");
    sendDeliveryUpdate({ email: customerEmail, name: "", orderId, status: deliveryStatus });
  }

  return NextResponse.json({ success: true });
}
