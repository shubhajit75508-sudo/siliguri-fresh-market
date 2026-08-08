-- Siliguri Fresh Mart — feature tables (push, waitlist, earnings)
-- Run in Supabase Dashboard → SQL Editor.

-- 1. Web Push subscriptions (VAPID)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint   TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  keys       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_owner_select" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner_select" ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_owner_insert" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner_insert" ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_owner_delete" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner_delete" ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- 2. Back-in-stock waitlist
CREATE TABLE IF NOT EXISTS public.stock_waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_waitlist_product_user ON public.stock_waitlist(product_id, user_id);

ALTER TABLE public.stock_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_waitlist_owner_select" ON public.stock_waitlist;
CREATE POLICY "stock_waitlist_owner_select" ON public.stock_waitlist FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "stock_waitlist_owner_insert" ON public.stock_waitlist;
CREATE POLICY "stock_waitlist_owner_insert" ON public.stock_waitlist FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. Delivery earnings ledger
CREATE TABLE IF NOT EXISTS public.delivery_earnings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_boy_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id        TEXT NOT NULL UNIQUE,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_earnings_boy ON public.delivery_earnings(delivery_boy_id);

ALTER TABLE public.delivery_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_earnings_admin_all" ON public.delivery_earnings;
CREATE POLICY "delivery_earnings_admin_all" ON public.delivery_earnings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "delivery_earnings_boy_select" ON public.delivery_earnings;
CREATE POLICY "delivery_earnings_boy_select" ON public.delivery_earnings FOR SELECT
  USING (delivery_boy_id = auth.uid());
