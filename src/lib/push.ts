import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Whether VAPID keys are configured (env vars present). */
export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Send a web push notification to every subscription for a user.
 *  Expired subscriptions (410/404) are pruned automatically. */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!pushConfigured() || !userId) return;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", userId);

  if (!subs?.length) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const body = JSON.stringify({ ...payload, url: payload.url ?? "/account/orders" });

  for (const sub of subs as { endpoint: string; keys: { p256dh: string; auth: string } }[]) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
    } catch (e: unknown) {
      const err = e as { statusCode?: number };
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } else {
        console.error("[push] send failed:", e);
      }
    }
  }
}
