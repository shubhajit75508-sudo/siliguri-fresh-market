# Checkout & Admin Fixes — Implementation Plan

## 1. Link user-store on login

**File:** `src/store/auth-store.ts`

Add import:
```ts
import { useUserStore } from "./user-store";
```

Inside the Supabase login path (around line 171), after `set((state) => {...})`, add:
```ts
const phone = newUser.phone || newUser.email;
useUserStore.getState().setUser({
  id: "user-" + phone.replace(/\D/g, ""),
  name: newUser.name,
  email: newUser.email,
  phone: phone,
  loyaltyPoints: 0,
});
```

Inside the local login path (around line 191), after `set({ currentUser: user })`, add:
```ts
useUserStore.getState().setUser({
  id: "user-" + user.phone.replace(/\D/g, ""),
  name: user.name,
  email: user.email,
  phone: user.phone,
  loyaltyPoints: 0,
});
```

## 2. Validate address before Place Order

**File:** `src/app/(shop)/checkout/page.tsx`

In `handlePlaceOrder` (around line 193), at the top, after the existing checks:
```ts
if (!selectedAddress) {
  toast.add("Please add a delivery address first", "error");
  return;
}
```

## 3. Show geolocation errors

**File:** `src/lib/hooks/use-geolocation.ts`

Change line 40 from:
```ts
.catch(() => {});
```
to:
```ts
.catch(() => setError("Could not resolve address from your location. Try entering pincode manually."));
```

## 4. Create delivery-boys API route

**New file:** `src/app/api/admin/delivery-boys/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ boys: [] });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, phone, role, avatar")
    .eq("role", "delivery");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boys: data ?? [] });
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const supabaseAdmin = createClient(url, key);
  const body = await req.json();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name, phone: body.phone, role: "delivery" },
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const { error: dbError } = await supabaseAdmin.from("users").upsert({
    id: authData.user.id,
    name: body.name,
    email: body.email,
    phone: body.phone,
    role: "delivery",
    loyalty_points: 0,
  });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true, id: authData.user.id });
}
```

## 5. Update admin delivery-boys page to use API

**File:** `src/app/admin/delivery-boys/page.tsx`

- Replace `localStorage.getItem("sfm-delivery-boys")` with `fetch("/api/admin/delivery-boys")` on mount
- On "Add" button, call `POST /api/admin/delivery-boys` and refresh the list

## 6. Update AssignModal to use API

**File:** `src/app/admin/orders/page.tsx`

In `AssignModal` (around line 235), replace:
```ts
const raw = localStorage.getItem("sfm-delivery-boys");
if (raw) setBoys(JSON.parse(raw));
```
with:
```ts
const res = await fetch("/api/admin/delivery-boys");
const json = await res.json();
setBoys(json.boys ?? []);
```
(Change the `useEffect` to be async)

## 7. Create customers API route

**New file:** `src/app/api/admin/customers/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ customers: [] });

  const supabaseAdmin = createClient(url, key);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, role, loyalty_points, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data ?? [] });
}
```

## 8. Update admin customers page

**File:** `src/app/admin/customers/page.tsx`

- On mount, fetch from `/api/admin/customers`
- Merge with local `auth-store.users` (filtered to customers)
- Display the merged list

## 9. Update delivery layout to poll API

**File:** `src/app/delivery/layout.tsx`

- Instead of `localStorage.getItem("sfm-orders")`, fetch `GET /api/admin/orders`
- Filter orders by `delivery_boy_id` matching the logged-in delivery boy
- Map to delivery store's assignment format
