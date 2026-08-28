/** WhatsApp merchant alerts via Green API (https://green-api.com).
 *  Inert until GREEN_API_INSTANCE_ID, GREEN_API_TOKEN and at least one of
 *  WHATSAPP_MERCHANT_PHONE / WHATSAPP_MERCHANT_PHONE_2 / WHATSAPP_MERCHANT_PHONE_3
 *  (with country code, e.g. "919876543210") are set. The same alert goes to
 *  every configured number. */
const MERCHANT_PHONES = () =>
  [
    process.env.WHATSAPP_MERCHANT_PHONE,
    process.env.WHATSAPP_MERCHANT_PHONE_2,
    process.env.WHATSAPP_MERCHANT_PHONE_3,
  ].filter((p): p is string => Boolean(p && p.trim()));

async function sendToPhone(instanceId: string, token: string, chatId: string, message: string) {
  try {
    const res = await fetch(
      `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message,
        }),
      }
    );
    if (!res.ok) console.error("[whatsapp] Green API error:", res.status, await res.text());
  } catch (e) {
    console.error("[whatsapp] send failed:", e);
  }
}

export async function sendWhatsAppAlert(message: string): Promise<void> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;
  const phones = MERCHANT_PHONES();
  const groupId = process.env.WHATSAPP_GROUP_ID;

  const targets = phones
    .map((p) => `${p}@c.us`)
    .concat(groupId && groupId.trim() ? [groupId.trim()] : []);

  if (!instanceId || !token || targets.length === 0) return;

  await Promise.allSettled(targets.map((chatId) => sendToPhone(instanceId, token, chatId, message)));
}
