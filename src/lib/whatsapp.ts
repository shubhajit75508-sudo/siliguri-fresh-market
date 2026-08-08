/** WhatsApp merchant alerts via Green API (https://green-api.com).
 *  Inert until GREEN_API_INSTANCE_ID, GREEN_API_TOKEN and
 *  WHATSAPP_MERCHANT_PHONE (with country code, e.g. "919876543210") are set. */
export async function sendWhatsAppAlert(message: string): Promise<void> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;
  const merchantPhone = process.env.WHATSAPP_MERCHANT_PHONE;

  if (!instanceId || !token || !merchantPhone) return;

  try {
    const res = await fetch(
      `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: `${merchantPhone}@c.us`,
          message,
        }),
      }
    );
    if (!res.ok) console.error("[whatsapp] Green API error:", res.status, await res.text());
  } catch (e) {
    console.error("[whatsapp] send failed:", e);
  }
}
