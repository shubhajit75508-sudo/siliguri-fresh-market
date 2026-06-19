import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Siliguri Fresh Mart <noreply@siligurifreshmart.com>";

function getResend(): Resend | null {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

export async function sendOrderConfirmation(params: {
  email: string;
  name: string;
  orderId: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  deliveryAddress: string;
  eta: number;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const itemsHtml = params.items
    .map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">₹${i.price}</td></tr>`)
    .join("");

  try {
    await resend.emails.send({
      from: fromEmail,
      to: params.email,
      subject: `Order Confirmed — ${params.orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#16a34a">Order Confirmed! 🎉</h2>
          <p>Hi <strong>${params.name}</strong>, your order <strong>${params.orderId}</strong> has been placed.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #ddd">Item</th><th style="text-align:center;padding:8px 0;border-bottom:2px solid #ddd">Qty</th><th style="text-align:right;padding:8px 0;border-bottom:2px solid #ddd">Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="2" style="padding:8px 0;font-weight:bold">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold">₹${params.total}</td></tr></tfoot>
          </table>
          <p style="color:#666;font-size:14px">Delivering to: ${params.deliveryAddress}</p>
          <p style="color:#666;font-size:14px">Estimated delivery: ${params.eta} minutes</p>
          <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track/${params.orderId}" style="background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none">Track Order</a></p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[email] sendOrderConfirmation failed:", e);
  }
}

export async function sendDeliveryUpdate(params: {
  email: string;
  name: string;
  orderId: string;
  status: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const statusMessages: Record<string, string> = {
    assigned: "Your order has been picked up by our delivery partner!",
    accepted: "Delivery partner is on the way to the store.",
    picked_up: "Your order has been picked up and is on its way!",
    delivered: "Your order has been delivered. Enjoy your meal! 🎉",
  };

  const message = statusMessages[params.status] ?? `Your order status has been updated to: ${params.status}`;
  const emoji = params.status === "delivered" ? "🎉" : "🚚";

  try {
    await resend.emails.send({
      from: fromEmail,
      to: params.email,
      subject: `Delivery Update — ${params.orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#16a34a">Delivery Update ${emoji}</h2>
          <p>Hi <strong>${params.name}</strong>,</p>
          <p>${message}</p>
          <p>Order: <strong>${params.orderId}</strong></p>
          <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/track/${params.orderId}" style="background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none">Track Live</a></p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[email] sendDeliveryUpdate failed:", e);
  }
}
