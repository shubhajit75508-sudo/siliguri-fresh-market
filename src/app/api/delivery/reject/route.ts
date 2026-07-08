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
    .select("rejected_by, address_snapshot")
    .eq("id", orderId)
    .single();
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const rejectedBy: string[] = Array.isArray(existing.rejected_by) ? (existing.rejected_by as string[]) : [];
  if (!rejectedBy.includes(userId)) {
    rejectedBy.push(userId);
  }

  // Determine the order's service area
  const addrSnapshot = existing.address_snapshot as Record<string, unknown> ?? {};
  const orderArea = (addrSnapshot.area as string) ?? "";

  // Count active boys in the same area (or all active if no area)
  let totalBoys = 0;
  if (orderArea) {
    const { count } = await supabaseAdmin
      .from("delivery_boys")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .ilike("area", orderArea);
    totalBoys = count ?? 0;
  }
  if (totalBoys === 0) {
    const { count } = await supabaseAdmin
      .from("delivery_boys")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    totalBoys = count ?? 0;
  }

  // If all eligible boys have rejected, cancel the order
  const allRejected = totalBoys > 0 && rejectedBy.length >= totalBoys;

  const updates: Record<string, unknown> = { rejected_by: rejectedBy };
  if (allRejected) {
    updates.status = "cancelled";
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return NextResponse.json({ error: "Failed to reject order" }, { status: 500 });

  if (allRejected) {
    // Restore stock like the cancel endpoint does
    try {
      const { data: fullOrder } = await supabaseAdmin.from("orders").select("items").eq("id", orderId).single();
      if (fullOrder?.items && Array.isArray(fullOrder.items)) {
        for (const item of fullOrder.items as any[]) {
          const productId = item.product?.id || item.productId;
          const quantity = item.quantity || 1;
          if (productId) {
            const { data: product } = await supabaseAdmin.from("products").select("stock").eq("id", productId).maybeSingle();
            const currentStock = (product?.stock ?? 0) + quantity;
            await supabaseAdmin.from("products").update({ stock: currentStock, in_stock: currentStock > 0 }).eq("id", productId);
          }
        }
      }
    } catch (e) { console.error("Failed to restore stock on auto-cancel:", e); }
  }

  return NextResponse.json({ success: true, cancelled: allRejected });
}
