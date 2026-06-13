# Backend Roadmap — Siliguri Fresh Mart

## Prerequisites
- Supabase project is set up (URL + anon key already in `.env.local`)
- `supabase/migration.sql` ready to run

---

## Step 1 → Run Database Migration
- Open Supabase Dashboard → SQL Editor
- Paste entire `supabase/migration.sql` and run
- Creates all 10 tables, indexes, triggers, RLS policies, seed categories
- Safe to re-run (uses `IF NOT EXISTS`)

---

## Step 2 → Set Service Role Key
- Supabase Dashboard → Project Settings → API → `service_role` key
- Copy into `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=...`
- Only used server-side (proxy, API routes, cron)

---

## Step 3 → Enable Supabase Auth (Email/Password)
- Supabase Dashboard → Authentication → Providers → Email
- Enable "Confirm email" (optional — disable for dev)
- Disable "Confirm phone" if not using SMS

---

## Step 4 → Connect Signup to Supabase Auth
**File: `src/store/auth-store.ts`**
- Signup already calls `supabase.auth.signUp()` with `options.data`
- Login already calls `supabase.auth.signInWithPassword()`
- Role recovery from `users` table already works
- **Nothing to change** — the dual-mode (Supabase + localStorage fallback) already exists

---

## Step 5 → Migrate Products to Supabase
**File: `src/lib/data/products.ts`**
- Replace hardcoded array with `fetchAllProducts()` from `src/lib/supabase/queries.ts`
- If Supabase is configured, fetch from DB; otherwise fall back to mock data
- Admin "Add Product" already calls `useAdminStore` — wire it to also `supabase.from("products").insert()`

---

## Step 6 → Migrate Orders to Supabase
**File: `src/store/order-store.ts`**
- On `createOrder`: also call `supabase.from("orders").insert()` and `supabase.from("order_items").insert()`
- On status updates: also call `supabase.from("orders").update()`
- On `assignDeliveryBoy`: also insert into `delivery_assignments` table
- Keep localStorage as fallback when Supabase is down

**File: `src/lib/supabase/queries.ts`**
- `fetchOrdersByUser()` already queries the `orders` table — update to include items from `order_items`

---

## Step 7 → Migrate Coupons to Supabase
**File: `src/store/coupon-store.ts`**
- On add/delete: call `supabase.from("coupons")` insert/delete
- On load: fetch from `supabase.from("coupons").select("*")`

---

## Step 8 → Migrate Notifications to Supabase
**File: `src/store/notification-store.ts`**
- Same pattern as coupons

---

## Step 9 → Migrate Delivery Boys to Supabase
**File: `src/app/admin/delivery-boys/page.tsx`**
- Currently uses localStorage (`sfm-delivery-boys`)
- Replace with `supabase.from("delivery_boys")` CRUD

---

## Step 10 → Real Email/Password Reset
**File: `src/app/auth/forgot-password/page.tsx`**
- Replace mock code with Supabase's built-in:
  ```ts
  await supabase.auth.resetPasswordForEmail(email)
  ```
- Supabase sends the email automatically (requires SMTP config in Supabase)

---

## Step 11 → Real OTP / Phone Auth
**File: `src/store/otp-store.ts`**
- Replace mock `1234` with actual Supabase phone auth:
  ```ts
  await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
  ```
- Requires Twilio or SMS provider configured in Supabase Dashboard

---

## Step 12 → File Upload for Product Images
**File: `src/app/admin/products/page.tsx`** (add form)
- Use Supabase Storage:
  ```ts
  const { data } = await supabase.storage.from('products').upload(file.name, file)
  const url = supabase.storage.from('products').getPublicUrl(data.path).data.publicUrl
  ```
- Storage bucket `products` must be created with public read policy

---

## Step 13 → Real-time Delivery Notifications
**File: `src/app/delivery/layout.tsx`**
- Replace `setInterval` polling with Supabase Realtime:
  ```ts
  supabase.channel('deliveries')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'delivery_assignments', filter: `delivery_boy_id=eq.${boy.id}` }, callback)
    .subscribe()
  ```

---

## Step 14 → Admin Analytics (Real Charts)
**File: `src/components/admin/revenue-chart.tsx`**
- Replace "No data yet" with a chart library (recharts or chart.js)
- Query `orders` table grouped by `created_at::date` for daily revenue
- Query `order_items` grouped by `product_id` for top products

---

## Step 15 → Deployment Prep
- Push to GitHub
- Connect Vercel project → set env vars from `.env.local`
- Set `NEXT_PUBLIC_APP_URL` to production URL
- Deploy — the standalone build (`output: "standalone"` in `next.config.ts`) works with Docker too

---

## Architecture After Migration

```
Browser (localStorage fallback)  ←→  Zustand Store  ←→  Supabase (primary)
                                                           ├── Auth (email/password)
                                                           ├── Database (Postgres)
                                                           └── Storage (images)
```

Each store tries Supabase first; if it fails or env vars are unset, falls back to localStorage. No code changes needed to toggle — just fill/empty `.env.local`.
