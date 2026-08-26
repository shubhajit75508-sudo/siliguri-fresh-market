-- =============================================================================
-- FIX: Add ALL missing columns to orders table
-- The server API upserts columns that don't exist in the original migration.
-- Run this in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
-- =============================================================================

-- Price breakdown (server computes and stores these)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Delivery code (server-generated 4-digit code)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_code TEXT NOT NULL DEFAULT '';

-- UPI payment reference
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Delivery time slots (for 8km+ deliveries)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_slot TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_window TEXT;

-- Delivery boy rejection tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejected_by JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Verify all columns exist
DO $$
BEGIN
  RAISE NOTICE 'Orders table columns after migration:';
END
$$;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;
