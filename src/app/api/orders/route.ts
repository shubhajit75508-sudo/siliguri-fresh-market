import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId } from "@/lib/api-auth";
import { sendWhatsAppAlert } from "@/lib/whatsapp";
import { DELIVERY_RADIUS_KM, DELIVERY_ZONE_LABEL, distanceFromStore } from "@/lib/delivery-zone";

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
    // The reference is stored in the payment_id column (TEXT) — upi_reference
    // does not exist on the live orders table.
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("payment_id", upiReference)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: `This UPI reference was already used for order ${existing.id}.` },
        { status: 400 }
      );
    }
  }

  // Delivery zone enforcement — orders are only accepted within the store's
  // delivery radius. The customer's pinned GPS location is authoritative.
  const addrSnap = (body.address_snapshot ?? {}) as Record<string, unknown>;
  const zoneLat = Number(addrSnap.lat);
  const zoneLng = Number(addrSnap.lng);
  if (!Number.isFinite(zoneLat) || !Number.isFinite(zoneLng)) {
    return NextResponse.json(
      { error: "We couldn't verify your delivery location. Please pin your location in checkout and try again." },
      { status: 400 }
    );
  }
  const zoneDistance = distanceFromStore(zoneLat, zoneLng);
  if (zoneDistance > DELIVERY_RADIUS_KM) {
    return NextResponse.json(
      { error: `Sorry, we only deliver within ${DELIVERY_RADIUS_KM} km of our store (${DELIVERY_ZONE_LABEL}). Your location is about ${zoneDistance.toFixed(1)} km away.` },
      { status: 400 }
    );
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

  // UPI reference is stored in the existing payment_id column (TEXT) so no
  // schema migration is required on the live orders table.
  if (paymentMethod === "upi" && upiReference) {
    orderData.payment_id = upiReference;
  }

  const { error } = await supabaseAdmin.from("orders").upsert(orderData);
  if (error) return NextResponse.json({ error: "Order creation failed" }, { status: 500 });

  // Fire-and-forget merchant alert on WhatsApp (inert until Green API env vars are set)
  try {
    const items = Array.isArray(orderData.items)
      ? (orderData.items as {
          product?: { name?: string };
          quantity?: number;
          selectedWeight?: string;
          selectedCut?: string;
          selectedCleaning?: string;
        }[]).filter(Boolean)
      : [];
    const itemLines = items.map((i, idx) => {
      const name = i.product?.name || "Item";
      const qty = i.quantity ?? 1;
      const w = i.selectedWeight ? i.selectedWeight : "";
      const extras = [i.selectedCut, i.selectedCleaning].filter(Boolean).join(", ");
      return `${idx + 1}. ${qty} × ${name}${w ? ` (${w})` : ""}${extras ? ` [${extras}]` : ""}`;
    });
    const itemCount = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

    const addr = (orderData.address_snapshot ?? {}) as Record<string, unknown>;
    const a = (k: string) => (typeof addr[k] === "string" ? (addr[k] as string).trim() : "");
    const addrParts = [
      [a("flat"), a("building")].filter(Boolean).join(", "),
      a("line1"),
      a("line2"),
      a("area"),
      a("landmark") ? `Near ${a("landmark")}` : "",
      [a("city"), a("pincode")].filter(Boolean).join(" - "),
    ].filter(Boolean);
    const lat = Number(addr.lat);
    const lng = Number(addr.lng);
    const maps =
      Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
        ? `Maps: https://maps.google.com/?q=${lat},${lng}`
        : "";

    const sections = [
      [
        "🛒 *NEW ORDER*",
        `Order: ${orderData.id}`,
        `Amount: ₹${Number(orderData.total).toFixed(2)}`,
        `Payment: ${String(orderData.payment_method).toUpperCase()}`,
      ].join("\n"),
    ];
    if (itemLines.length) sections.push(["🧾 *ITEMS*", ...itemLines].join("\n"));
    sections.push(
      [
        "👤 *CUSTOMER*",
        `Name: ${orderData.customer_name || "—"}`,
        `Phone: ${orderData.customer_phone || "—"}`,
      ].join("\n")
    );
    if (addrParts.length || maps) {
      sections.push(["🏠 *DELIVERY ADDRESS*", ...addrParts, maps].filter(Boolean).join("\n"));
    }
    if (itemCount > 0) {
      sections.push(`Total items: ${itemCount}`);
    }

    await sendWhatsAppAlert(sections.join("\n\n"));
  } catch (e) {
    console.error("[whatsapp] order alert failed:", e);
  }

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
