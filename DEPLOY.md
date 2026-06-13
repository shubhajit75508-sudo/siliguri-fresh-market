# Siliguri Fresh Mart — Production Deployment Guide

> **Goal**: Deploy the app to production with full Supabase backend, zero data leaks, and maximum security.

---

## Table of Contents

1. [Supabase Production Setup](#1-supabase-production-setup)
2. [Database Schema (Production)](#2-database-schema-production)
3. [Row-Level Security Policies](#3-row-level-security-policies)
4. [Admin Authentication & Guard](#4-admin-authentication--guard)
5. [Environment Variables & Secrets](#5-environment-variables--secrets)
6. [Deploy to Vercel](#6-deploy-to-vercel)
7. [Custom Domain & SSL](#7-custom-domain--ssl)
8. [Rate Limiting & DDoS Protection](#8-rate-limiting--ddos-protection)
9. [Monitoring & Error Tracking](#9-monitoring--error-tracking)
10. [Production Checklist](#10-production-checklist)

---

## 1. Supabase Production Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) → **Start your project**
2. Sign in with GitHub
3. Click **New project**

| Field | Value |
|---|---|
| Name | `siliguri-fresh-mart` |
| Database Password | Generate & save in password manager |
| Region | **Singapore** (lowest latency for Siliguri) |
| Pricing Plan | Free (scales to Pro at $25/mo when needed) |

### 1.2 Enable Email Confirmations (Anti-Bot)

In Supabase Dashboard → **Authentication** → **Settings**:

- **Confirm email** → ON
- **Secure email change** → ON
- **Rate limiting** → Set:
  - Sign-up: 1 request per 60 seconds per IP
  - Sign-in: 5 requests per 60 seconds per IP
  - Token refresh: 10 requests per 60 seconds

### 1.3 Disable Public Sign-Up (Optional)

If you only want admin-managed accounts:

- **Authentication** → **Providers** → **Email** → **Disable sign-ups**
- Or keep it on but require email confirmation

### 1.4 Create Service Role Key (Admin-Only Operations)

For admin write operations (creating products, managing orders), never use the anon key. Instead:

1. Go to **Project Settings** → **API**
2. Copy the **service_role key** (starts with `eyJ...`)
3. Create a server-only environment variable:

```bash
# .env.local (dev) or Vercel Dashboard (prod)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

This key bypasses RLS and must **never** be exposed to the browser. Use it only in server-side code or middleware.

---

## 2. Database Schema (Production)

### 2.1 Apply the Production Schema

In Supabase Dashboard → **SQL Editor** → **New query** → paste:

```sql
-- ============================================================
-- Siliguri Fresh Mart — Production Schema
-- Run once to set up all tables, indexes, RLS, and seed data.
-- ============================================================

-- 0. Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- 1. Tables
-- ============================================================

-- 1a. Products (public read, admin write)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  category text not null,
  price integer not null check (price >= 0),
  original_price integer check (original_price >= 0),
  discount integer default 0 check (discount >= 0 and discount <= 100),
  image text not null default '',
  images jsonb default '[]',
  unit text not null default 'kg',
  weights jsonb,
  freshness_score integer default 100 check (freshness_score >= 0 and freshness_score <= 100),
  delivery_eta integer default 30 check (delivery_eta >= 0),
  rating numeric(3,1) default 0 check (rating >= 0 and rating <= 5),
  review_count integer default 0 check (review_count >= 0),
  in_stock boolean default true,
  stock integer default 0 check (stock >= 0),
  is_flash_deal boolean default false,
  is_trending boolean default false,
  origin text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1b. Categories
create table if not exists categories (
  slug text primary key,
  name text not null,
  description text default '',
  icon text default '',
  color text default '',
  image text default ''
);

-- 1c. Users (synced with Supabase Auth via trigger)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text default '',
  is_admin boolean default false,
  loyalty_points integer default 0 check (loyalty_points >= 0),
  avatar text default '',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 1d. Addresses
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text default '',
  city text not null default 'Siliguri',
  pincode text not null default '734001',
  lat numeric,
  lng numeric,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 1e. Orders
create table if not exists orders (
  id text primary key,
  user_id uuid not null references profiles(id),
  status text not null default 'received'
    check (status in ('received', 'out_for_delivery', 'delivered', 'cancelled')),
  total integer not null check (total >= 0),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 29 check (delivery_fee >= 0),
  discount integer default 0 check (discount >= 0),
  coupon_code text,
  address_id uuid references addresses(id),
  payment_method text default 'cod',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz default now()
);

-- 1f. Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image text default '',
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  selected_weight text
);

-- 1g. Coupons
create table if not exists coupons (
  code text primary key,
  discount integer not null check (discount > 0),
  type text not null default 'flat'
    check (type in ('flat', 'percentage')),
  min_order integer default 0 check (min_order >= 0),
  max_uses integer default -1,
  used_count integer default 0 check (used_count >= 0),
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 1h. Notifications (admin broadcast)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  type text not null default 'info'
    check (type in ('info', 'promotional', 'order', 'alert')),
  sent_to integer default 0 check (sent_to >= 0),
  read boolean default false,
  created_at timestamptz default now()
);

-- 1i. User notification read state
create table if not exists user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  notification_id uuid not null references notifications(id) on delete cascade,
  read boolean default false,
  read_at timestamptz,
  unique(user_id, notification_id)
);

-- 2. Indexes
-- ============================================================
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_in_stock on products(in_stock) where in_stock = true;
create index if not exists idx_products_flash on products(is_flash_deal) where is_flash_deal = true;
create index if not exists idx_products_trending on products(is_trending) where is_trending = true;
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_addresses_user on addresses(user_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_coupons_active on coupons(is_active) where is_active = true;
create index if not exists idx_notifications_created on notifications(created_at desc);
create index if not exists idx_user_notifications_user on user_notifications(user_id);

-- 3. Row-Level Security
-- ============================================================
-- Enable RLS on all tables
alter table products enable row level security;
alter table categories enable row level security;
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table coupons enable row level security;
alter table notifications enable row level security;
alter table user_notifications enable row level security;

-- Products: public read
drop policy if exists "Products are publicly readable" on products;
create policy "Products are publicly readable" on products
  for select using (true);

-- Products: admin only write (insert, update, delete)
drop policy if exists "Only admins can insert products" on products;
create policy "Only admins can insert products" on products
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Only admins can update products" on products;
create policy "Only admins can update products" on products
  for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Only admins can delete products" on products;
create policy "Only admins can delete products" on products
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Categories: public read
drop policy if exists "Categories are publicly readable" on categories;
create policy "Categories are publicly readable" on categories
  for select using (true);

-- Profiles: own data only
drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id)
  with check (
    -- Cannot self-promote to admin
    (not (new.is_admin = true and old.is_admin = false))
    or
    -- Existing admin can do anything
    (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  );

-- Addresses: own data only
drop policy if exists "Users manage own addresses" on addresses;
create policy "Users manage own addresses" on addresses
  for all using (auth.uid() = user_id);

-- Orders: own orders, admin can see all
drop policy if exists "Users can read own orders" on orders;
create policy "Users can read own orders" on orders
  for select using (
    auth.uid() = user_id
    or
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users can insert own orders" on orders;
create policy "Users can insert own orders" on orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can update orders" on orders;
create policy "Admins can update orders" on orders
  for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Order items: via own orders or admin
drop policy if exists "Users can read own order items" on order_items;
create policy "Users can read own order items" on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and is_admin = true))
    )
  );

-- Coupons: public read (safe — only active coupons returned)
drop policy if exists "Coupons are publicly readable" on coupons;
create policy "Coupons are publicly readable" on coupons
  for select using (is_active = true);

-- Notifications: admin write, public read
drop policy if exists "Notifications are publicly readable" on notifications;
create policy "Notifications are publicly readable" on notifications
  for select using (true);

drop policy if exists "Admins can manage notifications" on notifications;
create policy "Admins can manage notifications" on notifications
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- User notifications: own data only
drop policy if exists "Users manage own notification reads" on user_notifications;
create policy "Users manage own notification reads" on user_notifications
  for all using (auth.uid() = user_id);

-- 4. Seed Data
-- ============================================================

-- Categories
insert into categories (slug, name, description, icon, color) values
  ('fish', 'Fresh Fish', 'River & sea catch daily', '🐟', '#1D4E9E'),
  ('chicken', 'Chicken', 'Farm-fresh poultry', '🍗', '#003D2B'),
  ('mutton', 'Mutton', 'Premium cuts', '🥩', '#8B2635'),
  ('seafood', 'Seafood', 'Prawns, crabs & more', '🦐', '#1B5BA8'),
  ('vegetables', 'Vegetables', 'Farm to table', '🥬', '#498B2C'),
  ('fruits', 'Fruits', 'Seasonal picks', '🍊', '#FB8C00'),
  ('eggs', 'Eggs', 'Free-range & farm', '🥚', '#D4A574'),
  ('dairy', 'Dairy', 'Milk, paneer & more', '🥛', '#4895EF'),
  ('grocery', 'Grocery', 'Pantry staples', '🛒', '#7B2D8E'),
  ('essentials', 'Essentials', 'Daily must-haves', '🧴', '#2D3436')
on conflict (slug) do nothing;

-- Products (featured items)
insert into products (slug, name, description, category, price, original_price, discount, image, unit, weights, freshness_score, delivery_eta, rating, review_count, in_stock, stock, is_flash_deal, is_trending, origin) values
  ('fresh-rohu', 'Fresh Rohu', 'River-caught Rohu from Teesta. Cleaned and cut to order.', 'fish', 320, 380, 16, 'https://images.unsplash.com/photo-1544943910-04c54e739fe9?w=800&q=80', 'kg', '["500g", "1kg", "2kg"]', 98, 15, 4.8, 234, true, 50, true, true, 'Teesta River'),
  ('tiger-prawns', 'Tiger Prawns', 'Large tiger prawns from Sundarbans. Peeled available.', 'seafood', 550, 620, 11, 'https://images.unsplash.com/photo-1565680018434-b513fd36e282?w=800&q=80', 'kg', '["250g", "500g", "1kg"]', 97, 18, 4.8, 278, true, 30, false, true, 'Sundarbans'),
  ('country-chicken', 'Country Chicken (Desi)', 'Free-range country chicken. Tender and flavorful.', 'chicken', 380, 420, 10, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80', 'kg', '["500g", "1kg", "1.5kg"]', 95, 12, 4.6, 567, true, 40, true, false, 'Local Farms, Siliguri'),
  ('mutton-curry-cut', 'Mutton Curry Cut', 'Premium goat meat curry cut. Tender and juicy.', 'mutton', 680, 750, 9, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80', 'kg', '["500g", "1kg"]', 94, 15, 4.7, 345, true, 25, true, false, 'Halal Certified Suppliers'),
  ('organic-tomatoes', 'Organic Tomatoes', 'Vine-ripened organic tomatoes from local farms.', 'vegetables', 45, 55, 18, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80', 'kg', '["500g", "1kg"]', 96, 10, 4.5, 1234, true, 200, false, true, 'Siliguri Organic Farms'),
  ('farm-fresh-eggs', 'Farm Fresh Eggs (12 pcs)', 'Free-range brown eggs. Rich in protein.', 'eggs', 85, null, 0, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80', 'dozen', null, 93, 10, 4.5, 2100, true, 500, false, false, 'Local Farms'),
  ('full-cream-milk', 'Full Cream Milk 1L', 'Pasteurized full cream milk. Delivered chilled.', 'dairy', 65, null, 0, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80', 'pack', null, 99, 8, 4.7, 3400, true, 100, false, true, 'Siliguri Dairy'),
  ('basmati-rice', 'Premium Basmati Rice 5kg', 'Aged basmati. Long grain, aromatic.', 'grocery', 450, 520, 13, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', 'pack', null, 100, 15, 4.6, 890, true, 80, false, false, 'North India')
on conflict (slug) do nothing;

-- Coupons
insert into coupons (code, discount, type, min_order, max_uses, used_count, is_active) values
  ('FRESH10', 10, 'percentage', 200, 1000, 0, true),
  ('FISH50', 50, 'flat', 299, 500, 0, true),
  ('WELCOME', 75, 'flat', 199, 1000, 0, false)
on conflict (code) do nothing;

-- Create your admin account (run after you sign up via the app)
-- Replace YOUR_USER_UUID with your auth.users id (get it from Authentication → Users)
-- insert into profiles (id, name, email, is_admin) values ('YOUR_USER_UUID', 'Admin', 'admin@example.com', true)
-- on conflict (id) do update set is_admin = true;
```

### 2.2 Schema Migration Notes

- The `profiles` table replaces the old `users` table — it's linked to Supabase Auth via a trigger
- When a user signs up, a profile is auto-created
- Admin is granted by setting `is_admin = true` (manually via SQL Editor)
- Added `stock` column for inventory tracking
- Added `discount` and `origin` columns to products
- Removed `is_prime` and old `cuts`/`cleaning_options` columns (you stripped those from the frontend)

---

## 3. Row-Level Security Policies

The schema above includes comprehensive RLS. Here is the security model:

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `products` | Public | Admin only | Admin only | Admin only |
| `categories` | Public | Admin only | Admin only | Admin only |
| `profiles` | Self + Admin | Auto (trigger) | Self (no self-promote) | — |
| `addresses` | Self | Self | Self | Self |
| `orders` | Self + Admin | Self | Admin only | — |
| `order_items` | Self (via order) | Self (via order) | Admin only | — |
| `coupons` | Public (active only) | Admin only | Admin only | Admin only |
| `notifications` | Public | Admin only | Admin only | Admin only |
| `user_notifications` | Self | Self | Self | Self |

### 3.1 Make Yourself Admin

After deploying, sign up once through the app, then:

1. Go to Supabase → **Authentication** → **Users**
2. Find your email → copy the **UUID**
3. Go to **SQL Editor** and run:

```sql
insert into profiles (id, name, email, is_admin)
values ('YOUR_UUID', 'Admin', 'your@email.com', true)
on conflict (id) do update set is_admin = true;
```

---

## 4. Admin Authentication & Guard

### 4.1 Update Middleware (`src/proxy.ts`)

The current proxy.ts has a stub. Replace it with real auth guard:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Only guard /admin routes
  if (!pathname.startsWith("/admin")) return response;

  // Skip the login page itself
  if (pathname === "/admin/login") return response;

  // Create a Supabase client for the middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    // No Supabase configured — allow local dev (mock mode)
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — redirect to admin login
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has admin role in profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    // Logged in but not admin — redirect to home with error
    return NextResponse.redirect(new URL("/?error=unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 4.2 Install the SSR package

```bash
npm install @supabase/ssr
```

### 4.3 Create Admin Login Page

Create `src/app/admin/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/supabase/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(email, password);
      router.push("/admin");
    } catch {
      setError("Invalid credentials or not an admin");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold">Admin Login</h1>
        {error && <p className="mb-4 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-3 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-brand-fresh/40"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-6 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-brand-fresh/40"
        />
        <button type="submit" className="w-full rounded-2xl bg-brand-fresh py-3 font-bold text-white hover:bg-brand-fresh-dim">
          Sign In
        </button>
      </form>
    </div>
  );
}
```

---

## 5. Environment Variables & Secrets

### 5.1 Required Variables

Create `.env.local` for local dev:

```bash
# Supabase (required for backend features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...public-anon-key

# Server-only (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role-key

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Siliguri Fresh Mart
```

### 5.2 Where to Set Them

| Environment | Where |
|---|---|
| Local dev | `.env.local` (gitignored) |
| Vercel Preview | Vercel Dashboard → Project → Settings → Environment Variables |
| Vercel Production | Same as above, with distinct values if needed |

### 5.3 Security Rules

- **Never** commit secrets to git — `.env.local` is already in `.gitignore`
- **Never** use `NEXT_PUBLIC_` prefix for secrets (bundle analyzer will leak them)
- The `SUPABASE_SERVICE_ROLE_KEY` must only be used in server components, API routes, or middleware
- Rotate keys if they are ever exposed

---

## 6. Deploy to Vercel

### 6.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial production build"
gh repo create siliguri-fresh-market --public --push
```

### 6.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

4. **Environment Variables** — add all from step 5
5. Click **Deploy**

### 6.3 Configure Preview Deployments

In Vercel Dashboard → **Project** → **Settings** → **Git**:

- **Preview deployments** → ON
- **Auto-assign domain** → ON (gets `<branch>-<project>.vercel.app`)
- **Skew protection** → ON (ensures API routes match the frontend version)

### 6.4 Set Production Branch

In the same settings page:

- **Production Branch** → `main` or `master`
- Only merges to `main` trigger production deploys
- Feature branches get isolated preview URLs

---

## 7. Custom Domain & SSL

### 7.1 Add Custom Domain

1. Buy a domain from any registrar (e.g., `siligurifreshmart.com`)
2. In Vercel Dashboard → **Project** → **Settings** → **Domains**
3. Enter your domain → click **Add**
4. Follow instructions to update DNS:
   - **Option A**: Point nameservers to Vercel (recommended — auto SSL)
   - **Option B**: Add a `CNAME` record pointing `www` to `cname.vercel-dns.com`

### 7.2 SSL Certificate

Vercel automatically provisions and renews SSL via Let's Encrypt. No config needed.

### 7.3 Update CSP with Your Domain

In `next.config.ts`, add your domain to `img-src` and `connect-src`:

```typescript
// next.config.ts — CSP section
key: "Content-Security-Policy",
value: [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://yourdomain.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; "),
```

---

## 8. Rate Limiting & DDoS Protection

### 8.1 Supabase Rate Limiting

Already configured in **Authentication** → **Settings** → **Rate Limits**:

| Endpoint | Limit |
|---|---|
| Sign-up | 1 / 60s per IP |
| Sign-in | 5 / 60s per IP |
| Token refresh | 10 / 60s per IP |

### 8.2 Vercel WAF (Web Application Firewall)

Vercel Pro ($20/mo) includes:
- **DDoS mitigation** — always-on, no config needed
- **WAF rules** — block by IP, country, ASN, user-agent
- **Rate limiting** — per-route configurable

For the Free plan, Vercel still provides basic DDoS protection.

### 8.3 App-Level Rate Limiting (Optional)

For high-traffic, add a rate limiter using Vercel KV or edge middleware:

```typescript
// src/middleware.ts (or src/proxy.ts)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function proxy(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new NextResponse("Too many requests", { status: 429 });
  }
  return NextResponse.next();
}
```

Requires Vercel KV (Redis) — free tier available.

---

## 9. Monitoring & Error Tracking

### 9.1 Vercel Analytics (Free)

Enable in Vercel Dashboard → **Project** → **Analytics**:
- **Web Analytics** — page views, top pages, geo-location
- **Speed Insights** — Core Web Vitals (LCP, CLS, INP)

### 9.2 Error Tracking with Sentry (Free)

```bash
npm install @sentry/nextjs
npx sentry-wizard -i nextjs --saas
```

Sentry catches:
- Unhandled React errors
- API route failures
- Server-side crashes
- Console warnings

Free tier: 5k events/month.

### 9.3 Uptime Monitoring

**Better Uptime** (free) or **Pingdom** (free tier):
- Monitor `https://yourdomain.com` every 5 minutes
- Get SMS/email alerts on downtime

---

## 10. Production Checklist

### Before Launch — Final Verification

- [ ] **Build passes**: `npm run build` — 0 errors
- [ ] **Lint clean**: `npm run lint` — 0 warnings
- [ ] **All routes respond**: manually visit every page
- [ ] **Product detail pages work**: no more 404 on click
- [ ] **Checkout flow**: add item → address → place order
- [ ] **Admin login**: sign in with admin credentials
- [ ] **Admin CRUD**: add, edit, delete a product
- [ ] **Admin orders**: see orders, change status
- [ ] **Coupon works**: apply discount code
- [ ] **Inventory edit**: change stock quantity
- [ ] **Notifications**: send and view notifications
- [ ] **Mobile responsive**: test on phone viewport
- [ ] **SSL**: domain shows padlock in browser
- [ ] **CSP headers**: verify via `curl -I https://yourdomain.com`
- [ ] **No console errors**: open DevTools → Console
- [ ] **No API leaks**: anon key not visible in source
- [ ] **SEO meta tags**: title, description render on each page
- [ ] **404 page**: navigate to `/nonexistent` → shows custom page

### Post-Launch

- [ ] Monitor Vercel Analytics daily for first week
- [ ] Check Supabase logs for slow queries
- [ ] Set up daily email backup (Supabase → Database Backup)
- [ ] Add `robots.txt` and `sitemap.xml` for SEO

---

## Quick Start — TL;DR

```bash
# 1. Create Supabase project → run the SQL schema above

# 2. Set environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# 3. Start developing (uses mock data if no .env.local)
npm run dev

# 4. For production, add real creds
npm run build  # should pass with 0 errors

# 5. Deploy to Vercel
npx vercel --prod
# Set env vars in Vercel dashboard

# 6. Make yourself admin
# Sign up once → get UUID from Supabase Auth → run:
# insert into profiles (id, name, email, is_admin) values ('YOUR_UUID', 'Admin', 'your@email.com', true);
```

---

> **Questions?** Refer to the existing code:
> - Data adapter: `src/lib/data/index.ts`
> - Supabase queries: `src/lib/supabase/queries.ts`
> - Auth helpers: `src/lib/supabase/auth.ts`
> - Admin guard: `src/proxy.ts`
> - Security headers: `next.config.ts`
> - Env template: `.env.local.example`
