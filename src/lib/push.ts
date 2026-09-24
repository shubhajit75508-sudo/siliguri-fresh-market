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

/** Expo Push API endpoint — sends to iOS/Android via Expo's push service. */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Best-effort send to the Expo push service (React Native app devices).
 * Requires a `device_push_subscriptions` row per user (created by the native
 * app via POST /api/push/device-subscribe). Dead tokens are pruned.
 */
export async function sendExpoPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!userId) return;

  const { data: tokens } = await supabase
    .from("device_push_subscriptions")
    .select("id, expo_token")
    .eq("user_id", userId);

  if (!tokens?.length) return;

  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const messages = (tokens as { id: string; expo_token: string }[]).map((t) => ({
    to: t.expo_token,
    title: payload.title,
    body: payload.body,
    data: { url: payload.url ?? "/account/orders" },
    sound: "default",
    priority: "high",
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error("[push] Expo push failed:", res.status, await res.text().catch(() => ""));
      return;
    }

    const bodyJson = (await res.json()) as { data?: { status?: string; details?: { error?: string } }[] };
    const results = bodyJson?.data ?? [];
    results.forEach((r, i) => {
      // "DeviceNotRegistered" means the app was uninstalled/token dead — prune.
      if (r?.status === "error" && r?.details?.error === "DeviceNotRegistered") {
        const t = tokens[i] as { id: string } | undefined;
        if (t?.id) {
          supabase.from("device_push_subscriptions").delete().eq("id", t.id).then();
        }
      }
    });
  } catch (e) {
    console.error("[push] Expo push send failed:", e);
  }
}

/** Write a row into the in-app `notifications` inbox for the user. */
export async function saveInboxNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!userId) return;
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      type: "order",
    });
  } catch (e) {
    console.error("[push] inbox save failed:", e);
  }
}

/** Send a web push notification to every subscription for a user.
 *  Expired subscriptions (410/404) are pruned automatically. */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!userId) return;

  // Native app devices (Expo push) — independent of VAPID config.
  await Promise.allSettled([
    sendExpoPushToUser(supabase, userId, payload),
    saveInboxNotification(supabase, userId, payload),
  ]);

  if (!pushConfigured()) return;

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
