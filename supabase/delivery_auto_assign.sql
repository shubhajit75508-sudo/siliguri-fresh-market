-- Add rejected_by column to track which delivery boys rejected an order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejected_by JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add area column to delivery_boy_profiles if not exists (for auto-area filter)
ALTER TABLE public.delivery_boy_profiles ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '';

-- Add max_active_orders column (for queue limit)
ALTER TABLE public.delivery_boy_profiles ADD COLUMN IF NOT EXISTS max_active_orders INT NOT NULL DEFAULT 5;

-- Index for fast pending-order lookups
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
