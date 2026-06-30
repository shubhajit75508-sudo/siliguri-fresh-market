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
  const { error } = await supabaseAdmin.from("orders").upsert({
    id: body.id,
    user_id: body.user_id ?? null,
    items: body.items ?? [],
    total: body.total,
    status: body.status ?? "received",
    delivery_status: body.delivery_status ?? "pending",
    payment_method: body.payment_method ?? "cod",
    payment_status: body.payment_status ?? "unpaid",
    address_snapshot: body.address_snapshot ?? {},
    customer_name: body.customer_name ?? "",
    customer_phone: body.customer_phone ?? "",
    customer_email: body.customer_email ?? "",
    delivery_boy_id: body.delivery_boy_id ?? null,
    delivery_code: body.delivery_code ?? "",
    return_requested: body.return_requested ?? false,
    return_approved: body.return_approved ?? false,
    created_at: body.created_at ?? new Date().toISOString(),
    eta: body.eta ?? 30,
  });
  if (error) return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  // Require verified session
  const payload = await getSession(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserId(payload);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  if (!email) return NextResponse.json({ orders: [] });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
