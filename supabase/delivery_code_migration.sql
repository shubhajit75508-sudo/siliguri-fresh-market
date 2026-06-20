-- Add delivery_code column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_code TEXT NOT NULL DEFAULT '';
