-- =============================================================================
-- MANUAL ORDERS (WhatsApp / call / offline) migration
-- Run this in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
-- =============================================================================

-- Extra charges (packaging, advanced payment surcharge, etc.) recorded by staff
-- when creating a manual order that did not come through the website.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS extra_charges DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Where the order originated: 'site' (default), 'manual' (WhatsApp/call/offline).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source TEXT NOT NULL DEFAULT 'site';

-- Optional note recorded for manual orders (stored for quick reference in admin).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_notes TEXT DEFAULT '';

-- Index for manual-order fleet tracking
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(order_source);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders' AND column_name IN ('extra_charges','order_source','order_notes')
ORDER BY ordinal_position;