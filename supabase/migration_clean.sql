-- =============================================================================
-- Siliguri Fresh Mart ??? Supabase Migration
-- Run this entire script in Supabase SQL Editor (one shot, safe to re-run)
-- =============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- 1a. users (extends the auth.users managed by Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','delivery')),
  address     TEXT NOT NULL DEFAULT '',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. categories
CREATE TABLE IF NOT EXISTS public.categories (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT ''
);

-- 1c. products
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL REFERENCES public.categories(slug),
  price           DOUBLE PRECISION NOT NULL,
  original_price  DOUBLE PRECISION,
  image           TEXT NOT NULL DEFAULT '',
  images          JSONB DEFAULT '[]'::jsonb,
  unit            TEXT NOT NULL DEFAULT 'kg',
  weight          JSONB DEFAULT '[]'::jsonb,
  cuts            JSONB DEFAULT '[]'::jsonb,
  freshness_score INT NOT NULL DEFAULT 100,
  delivery_eta    INT NOT NULL DEFAULT 30,
  rating          DOUBLE PRECISION NOT NULL DEFAULT 0,
  review_count    INT NOT NULL DEFAULT 0,
  in_stock        BOOLEAN NOT NULL DEFAULT true,
  stock           INT DEFAULT 0,
  is_flash_deal   BOOLEAN NOT NULL DEFAULT false,
  is_trending     BOOLEAN NOT NULL DEFAULT false,
  tags            JSONB DEFAULT '[]'::jsonb,
  nutrition       JSONB DEFAULT '{}'::jsonb,
  source          TEXT DEFAULT '',
  origin          TEXT DEFAULT '',
  catch_date      TEXT DEFAULT '',
  river           TEXT DEFAULT '',
  species         TEXT DEFAULT '',
  cleaning_options JSONB DEFAULT '[]'::jsonb,
  discount        DOUBLE PRECISION DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1d. addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT '',
  line1       TEXT NOT NULL DEFAULT '',
  line2       TEXT DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  pincode     TEXT NOT NULL DEFAULT '',
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                TEXT PRIMARY KEY,
  user_id           UUID REFERENCES public.users(id),
  items             JSONB NOT NULL DEFAULT '[]'::jsonb,
  total             DOUBLE PRECISION NOT NULL,
  status            TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','out_for_delivery','delivered','cancelled')),
  address_id        UUID REFERENCES public.addresses(id),
  address_snapshot  JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_method    TEXT NOT NULL DEFAULT 'cod',
  payment_status    TEXT NOT NULL DEFAULT 'unpaid',
  delivery_boy_id   TEXT,
  delivery_status   TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending','assigned','accepted','picked_up','delivered')),
  return_requested  BOOLEAN NOT NULL DEFAULT false,
  return_approved   BOOLEAN NOT NULL DEFAULT false,
  eta               INT NOT NULL DEFAULT 30,
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_phone    TEXT NOT NULL DEFAULT '',
  customer_email    TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1f. order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id),
  product_name  TEXT NOT NULL,
  quantity      DOUBLE PRECISION NOT NULL,
  price         DOUBLE PRECISION NOT NULL,
  weight        TEXT DEFAULT ''
);

-- 1g. coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  code       TEXT PRIMARY KEY,
  discount   DOUBLE PRECISION NOT NULL,
  type       TEXT NOT NULL DEFAULT 'flat' CHECK (type IN ('percentage','flat')),
  min_order  DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1h. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  body      TEXT NOT NULL DEFAULT '',
  type      TEXT NOT NULL DEFAULT 'promotional' CHECK (type IN ('promotional','order','membership','alert')),
  read      BOOLEAN NOT NULL DEFAULT false,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1i. delivery_boys
CREATE TABLE IF NOT EXISTS public.delivery_boys (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  area       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1j. delivery_assignments
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id            TEXT PRIMARY KEY,
  order_id      TEXT NOT NULL REFERENCES public.orders(id),
  delivery_boy_id TEXT NOT NULL REFERENCES public.delivery_boys(id),
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  address       JSONB NOT NULL DEFAULT '{}'::jsonb,
  items         JSONB NOT NULL DEFAULT '[]'::jsonb,
  total         DOUBLE PRECISION NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','accepted','picked_up','delivered')),
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at  TIMESTAMPTZ
);

-- 1k. delivery_locations (real-time GPS tracking, like Blinkit)
CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_boy_id TEXT NOT NULL REFERENCES public.delivery_boys(id),
  order_id        TEXT NOT NULL REFERENCES public.orders(id),
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  heading         DOUBLE PRECISION DEFAULT 0,
  speed           DOUBLE PRECISION DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_locations_boy_order ON public.delivery_locations(delivery_boy_id, order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_boy ON public.delivery_locations(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order ON public.delivery_locations(order_id);

-- Enable Realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.delivery_locations;

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_flash ON public.products(is_flash_deal) WHERE is_flash_deal = true;
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_boy ON public.orders(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_boy ON public.delivery_assignments(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_id);

-- =============================================================================
-- 3. TRIGGERS
-- =============================================================================

-- 3a. Single-admin enforcement (prevents a second admin row in users table)
CREATE OR REPLACE FUNCTION public.prevent_second_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' AND EXISTS (SELECT 1 FROM public.users WHERE role = 'admin' AND id != NEW.id) THEN
    RAISE EXCEPTION 'Only one admin account allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_second_admin_trigger ON public.users;
CREATE TRIGGER prevent_second_admin_trigger
  BEFORE INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_second_admin();

-- 3b. Auto-set customer role on signup (prevents customer from being set as admin/delivery)
CREATE OR REPLACE FUNCTION public.auto_set_customer_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_set_customer_role_trigger ON public.users;
CREATE TRIGGER auto_set_customer_role_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_customer_role();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- 4a. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Enable Realtime for live delivery tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4b. Public read access for products & categories (anyone can browse)
CREATE POLICY "products_read_public" ON public.products FOR SELECT USING (true);
CREATE POLICY "categories_read_public" ON public.categories FOR SELECT USING (true);

-- 4c. Users manage their own profile
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4d. Users manage their own addresses
CREATE POLICY "addresses_user_all" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- 4e. Users see their own orders; admins see all
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4f. Order items follow order visibility
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);

-- 4g. Notifications scoped to user
CREATE POLICY "notifications_user" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 4h. Coupons ??? admin manage, everyone reads
CREATE POLICY "coupons_read" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons_write_admin" ON public.coupons FOR INSERT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "coupons_delete_admin" ON public.coupons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4i. Delivery boys ??? admin manage
CREATE POLICY "delivery_boys_read" ON public.delivery_boys FOR SELECT USING (true);
CREATE POLICY "delivery_boys_write_admin" ON public.delivery_boys
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 4j. Delivery assignments ??? admin + assigned boy can see
CREATE POLICY "delivery_assignments_select" ON public.delivery_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
  delivery_boy_id = (SELECT id FROM public.delivery_boys WHERE id = delivery_boy_id)
);

-- =============================================================================
-- 5. SEED DATA
-- =============================================================================

-- 5a. Categories (run once)
INSERT INTO public.categories (slug, name, description, icon, color, image) VALUES
  ('fish', 'Fresh Fish', 'River-fresh catch daily', '????', '#1E88E5', '/categories/fish.jpg'),
  ('chicken', 'Chicken', 'Farm-fresh poultry', '????', '#FF7043', '/categories/chicken.jpg'),
  ('mutton', 'Mutton', 'Premium goat meat', '????', '#8D6E63', '/categories/mutton.jpg'),
  ('seafood', 'Seafood', 'Ocean delights', '????', '#00ACC1', '/categories/seafood.jpg'),
  ('vegetables', 'Vegetables', 'Farm-fresh greens', '????', '#66BB6A', '/categories/vegetables.jpg'),
  ('fruits', 'Fruits', 'Seasonal fruits', '????', '#FFA726', '/categories/fruits.jpg'),
  ('eggs', 'Eggs', 'Farm eggs', '????', '#FFCC80', '/categories/eggs.jpg'),
  ('dairy', 'Dairy', 'Milk & milk products', '????', '#90CAF9', '/categories/dairy.jpg'),
  ('grocery', 'Grocery', 'Daily essentials', '????', '#AB47BC', '/categories/grocery.jpg'),
  ('essentials', 'Essentials', 'Home staples', '????', '#78909C', '/categories/essentials.jpg')
ON CONFLICT (slug) DO NOTHING;

