# Siliguri Fresh Mart — Production Schema
# Run in Supabase SQL Editor after creating your project.

-- 0. Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- 1. Tables
-- ============================================================

-- 1a. Products
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

-- 1c. Profiles (synced with Supabase Auth)
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

-- 1h. Notifications
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

-- Products: admin only write
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
    (not (new.is_admin = true and old.is_admin = false))
    or
    (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  );

-- Addresses: own data only
drop policy if exists "Users manage own addresses" on addresses;
create policy "Users manage own addresses" on addresses
  for all using (auth.uid() = user_id);

-- Orders: own or admin
drop policy if exists "Users can read own orders" on orders;
create policy "Users can read own orders" on orders
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
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

-- Coupons: active only
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
  ('tiger-prawns', 'Tiger Prawns', 'Large tiger prawns from Sundarbans.', 'seafood', 550, 620, 11, 'https://images.unsplash.com/photo-1565680018434-b513fd36e282?w=800&q=80', 'kg', '["250g", "500g", "1kg"]', 97, 18, 4.8, 278, true, 30, false, true, 'Sundarbans'),
  ('country-chicken', 'Country Chicken (Desi)', 'Free-range country chicken. Tender and flavorful.', 'chicken', 380, 420, 10, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80', 'kg', '["500g", "1kg", "1.5kg"]', 95, 12, 4.6, 567, true, 40, true, false, 'Local Farms, Siliguri'),
  ('mutton-curry-cut', 'Mutton Curry Cut', 'Premium goat meat curry cut.', 'mutton', 680, 750, 9, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80', 'kg', '["500g", "1kg"]', 94, 15, 4.7, 345, true, 25, true, false, 'Halal Certified Suppliers'),
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
