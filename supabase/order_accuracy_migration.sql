-- Order accuracy migration: persist subtotal + delivery fee breakdown so admin
-- can reconcile each order. Columns are added IF NOT EXISTS so this is safe on
-- the live project (legacy createOrder in queries.ts already writes them).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION NOT NULL DEFAULT 0;
