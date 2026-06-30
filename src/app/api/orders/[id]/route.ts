import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdmin() {
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "cancelled") return NextResponse.json({ error: "Order already cancelled" }, { status: 400 });
  if (order.status !== "received" && order.delivery_status !== "pending" && order.delivery_status !== "assigned") {
    return NextResponse.json({ error: "Cannot cancel order in current state" }, { status: 400 });
  }

  const dbUpdates: Record<string, unknown> = { status: "cancelled" };
  if (order.payment_status === "paid") dbUpdates.payment_status = "refunded";

  const { error: updateError } = await supabaseAdmin.from("orders").update(dbUpdates).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Cancel failed" }, { status: 500 });

  try {
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items as any[]) {
        const productId = item.product?.id || item.productId;
        const quantity = item.quantity || 1;
        if (productId) {
          const { data: product } = await supabaseAdmin.from("products").select("stock").eq("id", productId).maybeSingle();
          const currentStock = (product?.stock ?? 0) + quantity;
          await supabaseAdmin.from("products").update({ stock: currentStock, in_stock: currentStock > 0 }).eq("id", productId);
        }
      }
    }
  } catch (e) {
    console.error("Failed to restore stock on cancel:", e);
  }

  return NextResponse.json({ success: true });
}
