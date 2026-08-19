-- Add subcategory column to products table (fish only, default "unassigned")
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'unassigned';
