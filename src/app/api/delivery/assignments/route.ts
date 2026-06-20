import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const boyId = searchParams.get("boy_id");

  if (!boyId) {
    return NextResponse.json({ error: "Missing boy_id param" }, { status: 400 });
  }

  const { data: assignments, error } = await supabaseAdmin
    .from("delivery_assignments")
    .select("*")
    .eq("delivery_boy_id", boyId)
    .order("assigned_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderIds = (assignments ?? []).map((a) => a.order_id).filter(Boolean);

  const orderMap: Record<string, { delivery_code: string; payment_status: string }> = {};
  if (orderIds.length > 0) {
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, delivery_code, payment_status")
      .in("id", orderIds);

    if (orders) {
      for (const o of orders) {
        orderMap[o.id] = { delivery_code: o.delivery_code ?? "", payment_status: o.payment_status ?? "unpaid" };
      }
    }
  }

  const mapped = (assignments ?? []).map((a: Record<string, unknown>) => {
    const orderInfo = orderMap[a.order_id as string];
    return {
      id: a.id as string,
      orderId: a.order_id as string,
      deliveryBoyId: a.delivery_boy_id as string,
      customerName: a.customer_name as string,
      customerPhone: a.customer_phone as string,
      paymentStatus: (orderInfo?.payment_status as "paid" | "unpaid") ?? undefined,
      address: a.address as Record<string, unknown>,
      items: a.items as { name: string; quantity: number }[],
      total: a.total as number,
      status: a.status as string,
      assignedAt: a.assigned_at as string,
      deliveredAt: a.delivered_at as string | undefined,
      deliveryCode: orderInfo?.delivery_code ?? undefined,
    };
  });

  return NextResponse.json({ assignments: mapped });
}
