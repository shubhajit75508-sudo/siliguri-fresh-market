-- Profit Analytics Migration
-- Run this in Supabase Dashboard → SQL Editor

-- Products: add buying_prices + weight_prices columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS buying_prices JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_prices JSONB DEFAULT '[]'::jsonb;

-- Orders: add delivered_at timestamp
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
