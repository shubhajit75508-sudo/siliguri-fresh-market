import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession, getUserId } from "@/lib/api-auth";
import { sendWhatsAppAlert } from "@/lib/whatsapp";
import { DELIVERY_RADIUS_KM, DELIVERY_ZONE_LABEL, distanceFromStore, getDeliveryFeeForDistance } from "@/lib/delivery-zone";
import { getWeightMultiplier } from "@/lib/utils";

interface RawOrderItem {
  product?: { id?: string; name?: string; price?: number; image?: string };
  quantity?: number;
  selectedWeight?: string;
  selectedCut?: string;
  selectedCleaning?: string;
}

interface ProductRow {
  id: string | number;
  price?: number | string | null;
  weight?: string | null;
  weight_prices?: { weight: string; price: number }[] | null;
  unit?: string | null;
}

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
    // payment_id may not exist as a top-level column, so we also check the
    // JSONB address_snapshot where it is stored as a fallback.
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .or(`payment_id.eq.${upiReference},address_snapshot->>payment_id.eq.${upiReference}`)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: `This UPI reference was already used for order ${existing.id}.` },
        { status: 400 }
      );
    }
  }

  // ── Server-side price recompute ──
  // The client-sent `total` is NOT trusted. The subtotal is rebuilt from the
  // products table (current price × weight multiplier × quantity), the delivery
  // fee is re-derived from the same tier table, and the coupon discount is
  // clamped so the final total can never be dragged below the real product cost.
  const rawItems = Array.isArray(body.items) ? (body.items as RawOrderItem[]) : [];
  const productIds = rawItems.map((i) => i?.product?.id).filter(Boolean);
  let products: ProductRow[] = [];
  if (productIds.length) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, price, weight, weight_prices, unit")
      .in("id", productIds);
    products = (data ?? []) as ProductRow[];
  }
  const priceById = new Map<string, { price: number; weightPrices?: { weight: string; price: number }[] }>();
  for (const p of products) {
    priceById.set(String(p.id), {
      price: Number(p.price) || 0,
      weightPrices: Array.isArray(p.weight_prices) ? p.weight_prices : undefined,
    });
  }

  let subtotal = 0;
  const serverItems: Record<string, unknown>[] = [];
  for (const item of rawItems) {
    const productId = item?.product?.id as string;
    const quantity = Number(item?.quantity) || 0;
    if (quantity <= 0) continue;
    const known = priceById.get(productId);
    const clientPrice = Number(item?.product?.price) || 0;
    // Prefer the server's current price; fall back to the client-sent snapshot
    // only for products that no longer exist in the DB.
    const price = known ? known.price : clientPrice;
    const weight = typeof item?.selectedWeight === "string" ? item.selectedWeight : "";
    const unitPrice = known?.weightPrices
      ? (known.weightPrices.find((w) => w.weight.toLowerCase() === weight.toLowerCase())?.price ?? price * getWeightMultiplier(weight))
      : price * getWeightMultiplier(weight);
    subtotal += unitPrice * quantity;
    serverItems.push({
      product: { id: productId, name: item?.product?.name ?? "", price, image: item?.product?.image ?? "" },
      quantity,
      selectedWeight: weight || undefined,
      selectedCut: item?.selectedCut ?? undefined,
      selectedCleaning: item?.selectedCleaning ?? undefined,
    });
  }

  // Delivery fee tiers — distance-based when GPS coords are available.
  const addrSnap = (body.address_snapshot ?? {}) as Record<string, unknown>;
  const zoneLat = Number(addrSnap.lat);
  const zoneLng = Number(addrSnap.lng);
  const hasCoords =
    Number.isFinite(zoneLat) && Number.isFinite(zoneLng) && zoneLat !== 0 && zoneLng !== 0;
  const distanceKm = hasCoords ? distanceFromStore(zoneLat, zoneLng) : null;
  const deliveryFee = distanceKm !== null
    ? getDeliveryFeeForDistance(distanceKm, subtotal)
    : subtotal < 99 ? 59 : subtotal < 299 ? 40 : 0;
  const couponDiscount = Math.min(Math.max(Number(body.coupon_discount) || 0, 0), subtotal);
  const total = Math.round((subtotal + deliveryFee - couponDiscount) * 100) / 100;

  if (!Number.isFinite(total) || total <= 0 || total > 500000) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  // Delivery zone enforcement — orders are only accepted within the store's
  // delivery radius when GPS coords were captured. GPS is mandatory — orders
  // without location data are rejected.
  if (!hasCoords) {
    return NextResponse.json(
      { error: "Location is required to place an order. Please enable location detection." },
      { status: 400 }
    );
  }
  {
    const zoneDistance = distanceFromStore(zoneLat, zoneLng);
    if (zoneDistance > DELIVERY_RADIUS_KM) {
      return NextResponse.json(
        { error: `Sorry, we only deliver within ${DELIVERY_RADIUS_KM} km of our hub at ${DELIVERY_ZONE_LABEL}. Your location is about ${zoneDistance.toFixed(1)} km away.` },
        { status: 400 }
      );
    }
  }

  // The delivery code is ALWAYS generated server-side — never trusted from the client.
  const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Payment status is always set by the server — never trusted from the client.
  // Admins mark orders paid only after manually verifying the UPI transaction.
  //
  // Store extra metadata inside address_snapshot (JSONB) so the upsert only
  // writes to columns that are guaranteed to exist in the original orders table.
  // Columns like subtotal, delivery_fee, discount, payment_id, delivery_slot,
  // delivery_window, and delivery_code may not exist yet if the migrations
  // haven't been run. Keeping them in address_snapshot avoids "column does not
  // exist" errors while the migration is still pending.
  const enrichedSnapshot = {
    ...(body.address_snapshot ?? {}),
    zone_verified: hasCoords,
    distance_km: distanceKm,
    subtotal,
    delivery_fee: deliveryFee,
    discount: couponDiscount,
    delivery_code: deliveryCode,
    delivery_slot: body.delivery_slot ?? null,
    delivery_window: body.delivery_window ?? null,
    payment_id: paymentMethod === "upi" && upiReference ? upiReference : null,
  };

  // Only use columns guaranteed to exist in the live DB.
  // - Original migration columns: id, user_id, items, total, status, address_snapshot, payment_method, payment_status, delivery_boy_id, delivery_status, return_requested, return_approved, eta, customer_name, customer_phone, customer_email, created_at
  // - delivery_code: added by delivery_code_migration.sql (APPLIED)
  // NOT included (column may not exist): subtotal, delivery_fee, discount, payment_id, delivery_slot, delivery_window
  const orderData: Record<string, unknown> = {
    id: body.id,
    user_id: body.user_id ?? null,
    items: serverItems,
    total,
    status: body.status ?? "received",
    delivery_status: body.delivery_status ?? "pending",
    payment_method: paymentMethod,
    payment_status: "unpaid",
    address_snapshot: enrichedSnapshot,
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

  const { error } = await supabaseAdmin.from("orders").upsert(orderData);
  if (error) {
    console.error("[orders] Supabase upsert error:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Order creation failed — please try again" }, { status: 500 });
  }

  // Fire-and-forget merchant alert on WhatsApp — do NOT await (prevents
  // Vercel serverless timeout if Green API is slow/down).
  {
    const alertItems = Array.isArray(orderData.items)
      ? (orderData.items as {
          product?: { name?: string };
          quantity?: number;
          selectedWeight?: string;
          selectedCut?: string;
          selectedCleaning?: string;
        }[]).filter(Boolean)
      : [];
    const itemLines = alertItems.map((i, idx) => {
      const name = i.product?.name || "Item";
      const qty = i.quantity ?? 1;
      const w = i.selectedWeight ? i.selectedWeight : "";
      const extras = [i.selectedCut, i.selectedCleaning].filter(Boolean).join(", ");
      return `${idx + 1}. ${qty} × ${name}${w ? ` (${w})` : ""}${extras ? ` [${extras}]` : ""}`;
    });
    const itemCount = alertItems.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

    const addr = enrichedSnapshot as Record<string, unknown>;
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

    // Fire-and-forget — intentionally not awaited
    sendWhatsAppAlert(sections.join("\n\n")).catch((e) =>
      console.error("[whatsapp] order alert failed:", e)
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  // Verify session — return empty if not authenticated (no PII leak)
  const payload = await getSession(req);
  if (!payload) {
    // Guest lookup: allow a customer to find their own orders by the mobile
    // number they entered at checkout (no account/session required).
    const phoneParam = new URL(req.url).searchParams.get("phone") ?? "";
    const phone = phoneParam.replace(/\D/g, "");
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ orders: [] });
    }
    const { data: phoneOrders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });

    // Redact PII + the delivery code — a phone-only lookup shouldn't expose the
    // delivery verification code, name, or address.
    const redacted = (phoneOrders ?? []).map((o) => {
      const r: Record<string, unknown> = { ...o };
      delete r.user_id;
      delete r.customer_name;
      delete r.customer_phone;
      delete r.customer_email;
      delete r.address_snapshot;
      delete r.delivery_code;
      return r;
    });
    return NextResponse.json({ orders: redacted });
  }

  const userId = getUserId(payload);
  if (!userId) return NextResponse.json({ orders: [] });

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
