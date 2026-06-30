import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function PUT(req: NextRequest) {
  // Require authenticated session (delivery boy or admin)
  const payload = await getSession(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { deliveryBoyId, orderId, lat, lng, heading, speed } = await req.json();

    if (!deliveryBoyId || !orderId || lat == null || lng == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the caller is either the delivery boy themselves or an admin
    const isAdmin = payload.endsWith("|admin");
    const userId = payload.split("|")[0];
    if (!isAdmin && userId !== deliveryBoyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
  // Require authenticated session (customer tracking their own order, or admin)
  const payload = await getSession(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ location: null });
  }

  const orderId = req.nextUrl.searchParams.get("order_id");
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id param" }, { status: 400 });
  }

  try {
    // Verify the customer owns this order, or caller is admin/delivery
    const isAdmin = payload.endsWith("|admin");
    const isDelivery = payload.includes("|delivery");
    if (!isAdmin && !isDelivery) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("user_id")
        .eq("id", orderId)
        .maybeSingle();
      const userId = payload.split("|")[0];
      if (!order || order.user_id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

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
