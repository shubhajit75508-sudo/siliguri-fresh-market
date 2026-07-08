-- Add rejected_by column to track which delivery boys rejected an order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejected_by JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add max_active_orders column to delivery_boys (for queue limit, defaults to 5)
ALTER TABLE public.delivery_boys ADD COLUMN IF NOT EXISTS max_active_orders INT NOT NULL DEFAULT 5;

-- Index for fast pending-order lookups
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
