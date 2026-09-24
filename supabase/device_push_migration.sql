-- =============================================================================
-- NATIVE APP (React Native / Expo) PUSH TOKENS migration
-- Run this in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
--
-- The web app uses Web Push (VAPID) subscriptions in `push_subscriptions`.
-- The React Native customer app (com.siligurifreshmart.customer) uses Expo Push
-- tokens, which are stored here and dispatched via Expo's push API alongside
-- the existing web push flow. A single user may have web AND device tokens.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expo_token  TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT 'android',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT device_push_subscription_unique UNIQUE (user_id, expo_token)
);

CREATE INDEX IF NOT EXISTS idx_device_push_subscriptions_user
  ON public.device_push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_device_push_subscriptions_token
  ON public.device_push_subscriptions(expo_token);

-- RLS: users can only read/insert/delete their own device tokens.
ALTER TABLE public.device_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_select_own" ON public.device_push_subscriptions;
CREATE POLICY "device_tokens_select_own"
  ON public.device_push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "device_tokens_insert_own" ON public.device_push_subscriptions;
CREATE POLICY "device_tokens_insert_own"
  ON public.device_push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "device_tokens_delete_own" ON public.device_push_subscriptions;
CREATE POLICY "device_tokens_delete_own"
  ON public.device_push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- Verify
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'device_push_subscriptions'
ORDER BY ordinal_position;