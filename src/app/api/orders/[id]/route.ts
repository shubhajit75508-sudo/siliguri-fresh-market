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

/** Extract email from the signed session cookie */
async function getSessionEmail(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie?.value) return null;
  const raw = cookie.value;
  if (!raw.includes(".")) return raw.includes("|") ? raw.split("|")[0] : raw;
  // HMAC-signed cookie — verify signature
  const secret = process.env.COOKIE_SECRET;
  if (!secret) return null;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = await crypto.subtle.sign("HMAC", key, enc.encode(raw.split(".")[0]));
    const sig = btoa(String.fromCharCode(...new Uint8Array(expected))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    if (sig !== raw.split(".")[1]) return null;
    return raw.split(".")[0].includes("|") ? raw.split(".")[0].split("|")[0] : raw.split(".")[0];
  } catch { return null; }
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

  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.customer_email !== email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status === "cancelled") return NextResponse.json({ error: "Order already cancelled" }, { status: 400 });
  if (order.status !== "received" && order.delivery_status !== "pending" && order.delivery_status !== "assigned") {
    return NextResponse.json({ error: "Cannot cancel order in current state" }, { status: 400 });
  }

  const dbUpdates: Record<string, unknown> = { status: "cancelled" };
  if (order.payment_status === "paid") dbUpdates.payment_status = "refunded";

  const { error: updateError } = await supabaseAdmin.from("orders").update(dbUpdates).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Cancel failed" }, { status: 500 });

  // Restore product stock
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
