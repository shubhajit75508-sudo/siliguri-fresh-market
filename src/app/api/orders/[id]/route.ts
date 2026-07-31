import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId, getRole, requireAdmin } from "@/lib/api-auth";

const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdmin() {
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

async function resolveCallerEmail(supabaseAdmin: any, userId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    if (data?.email) return data.email as string;
  } catch {}
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Check whether the caller may view/cancel an order.
 * Returns true for the order owner (user_id or customer_email match),
 * for the assigned delivery boy, and for admins.
 */
async function canAccessOrder(
  supabaseAdmin: any,
  payload: string,
  order: { user_id?: string | null; customer_email?: string | null; delivery_boy_id?: string | null }
): Promise<boolean> {
  const userId = getUserId(payload);
  const role = getRole(payload);
  if (!userId) return false;

  if (role === "admin") return true;
  if (role === "delivery") return order.delivery_boy_id === userId;

  // customer
  if (order.user_id && order.user_id === userId) return true;
  if (order.customer_email) {
    const callerEmail = await resolveCallerEmail(supabaseAdmin, userId);
    if (callerEmail && callerEmail.toLowerCase() === String(order.customer_email).toLowerCase()) return true;
  }
  return false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const payload = await getSession(_req);
  if (!payload) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const allowed = await canAccessOrder(supabaseAdmin, payload, data as any);
  if (!allowed) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ order: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const admin = await requireAdmin(req);
  const payload = await getSession(req);
  if (!admin && !payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "cancelled") return NextResponse.json({ error: "Order already cancelled" }, { status: 400 });
  if (order.status === "delivered" || order.delivery_status === "delivered") {
    return NextResponse.json({ error: "Cannot cancel a delivered order" }, { status: 400 });
  }

  const isAdmin = Boolean(admin);
  if (!isAdmin) {
    // Non-admin callers can only cancel their own order while it's still "received"
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const allowed = await canAccessOrder(supabaseAdmin, payload, order as any);
    if (!allowed) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "received") {
      return NextResponse.json({ error: "You can only cancel orders that are still received" }, { status: 400 });
    }
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
