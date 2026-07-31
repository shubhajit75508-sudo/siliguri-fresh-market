import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId } from "@/lib/api-auth";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  // Order creation does not require server-side auth — the checkout page
  // already validates the user is logged in before calling this endpoint.
  // Auth is handled by the order store/client-side redirect if not logged in.

  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();

  const total = Number(body.total);
  if (!Number.isFinite(total) || total <= 0 || total > 500000) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  const paymentMethod = String(body.payment_method ?? "cod");
  const upiReference = String(body.upi_reference ?? "").replace(/\s+/g, "");

  if (paymentMethod === "upi") {
    // UPI references (RRN) are 12-digit numbers; accept 10-22 digits to also cover
    // IMPS/UTR references some banks return.
    if (!/^\d{10,22}$/.test(upiReference)) {
      return NextResponse.json(
        { error: "Invalid UPI reference. Enter the 12-digit transaction number from your UPI app." },
        { status: 400 }
      );
    }
    // Prevent a single payment reference from being claimed on multiple orders.
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("upi_reference", upiReference)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: `This UPI reference was already used for order ${existing.id}.` },
        { status: 400 }
      );
    }
  }

  // The delivery code is ALWAYS generated server-side — never trusted from the client.
  const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Payment status is always set by the server — never trusted from the client.
  // Admins mark orders paid only after manually verifying the UPI transaction.
  const orderData: Record<string, unknown> = {
    id: body.id,
    user_id: body.user_id ?? null,
    items: body.items ?? [],
    total,
    status: body.status ?? "received",
    delivery_status: body.delivery_status ?? "pending",
    payment_method: paymentMethod,
    payment_status: "unpaid",
    address_snapshot: body.address_snapshot ?? {},
    customer_name: body.customer_name ?? "",
    customer_phone: body.customer_phone ?? "",
    customer_email: body.customer_email ?? "",
    delivery_boy_id: body.delivery_boy_id ?? null,
    delivery_code: deliveryCode,
    return_requested: body.return_requested ?? false,
    return_approved: body.return_approved ?? false,
    created_at: body.created_at ?? new Date().toISOString(),
    eta: body.eta ?? 30,
  };

  // payment_id column may not exist yet — include it only if provided
  if (body.payment_id) {
    orderData.payment_id = body.payment_id;
  }

  // upi_reference column — include only if provided and valid
  if (paymentMethod === "upi" && upiReference) {
    orderData.upi_reference = upiReference;
  }

  const { error } = await supabaseAdmin.from("orders").upsert(orderData);
  if (error) return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  // Verify session — return empty if not authenticated (no PII leak)
  const payload = await getSession(req);
  if (!payload) {
    return NextResponse.json({ orders: [] });
  }

  const userId = getUserId(payload);
  if (!userId) return NextResponse.json({ orders: [] });

  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  let email: string | null = null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (user?.email) {
    email = user.email;
  } else {
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        email = authUser.user.email;
      }
    } catch {
      // auth lookup failed — continue with empty email
    }
  }

  let orders: Record<string, unknown>[] | null = null;

  if (email) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
    orders = data;
  }

  // Fallback: if no orders found by email (or email was missing), try by user_id
  if ((!orders || orders.length === 0) && userId) {
    const { data: ordersByUserId, error: err2 } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err2) return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
    if (ordersByUserId) orders = ordersByUserId;
  }

  return NextResponse.json({ orders: orders ?? [] });
}
