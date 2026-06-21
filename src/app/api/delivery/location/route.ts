import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function PUT(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { deliveryBoyId, orderId, lat, lng, heading, speed } = await req.json();

    if (!deliveryBoyId || !orderId || lat == null || lng == null) {
      return NextResponse.json({ error: "Missing required fields: deliveryBoyId, orderId, lat, lng" }, { status: 400 });
    }

    // Delete old location for this boy+order, then insert new
    await supabaseAdmin.from("delivery_locations").delete()
      .eq("delivery_boy_id", deliveryBoyId)
      .eq("order_id", orderId);

    await supabaseAdmin.from("delivery_locations").insert({
      delivery_boy_id: deliveryBoyId,
      order_id: orderId,
      lat,
      lng,
      heading: heading ?? 0,
      speed: speed ?? 0,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[location] update error:", err);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ location: null });
  }

  const orderId = req.nextUrl.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id param" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .select("*")
      .eq("order_id", orderId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ location: data ?? null });
  } catch {
    return NextResponse.json({ location: null });
  }
}
