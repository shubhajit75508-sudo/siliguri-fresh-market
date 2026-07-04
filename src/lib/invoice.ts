import type { Order } from "@/types";

export async function downloadInvoice(order: Order): Promise<void> {
  const [jsPDF, html2canvas] = await Promise.all([
    import("jspdf").then((m) => new m.default()),
    import("html2canvas"),
  ]);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.padding = "40px";
  container.style.fontFamily = "Inter, sans-serif";
  container.style.background = "#ffffff";
  container.style.color = "#111827";
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.5";
  container.innerHTML = `
    <div style="border-bottom: 2px solid #2D7D3A; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 800; color: #2D7D3A; margin: 0;">Siliguri Fresh Mart</h1>
      <p style="margin: 4px 0 0; color: #6b7280;">Fresh Market Delivered in Minutes</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <p style="font-weight: 700; margin: 0 0 4px;">Invoice</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">Order #${order.id}</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
      </div>
      <div style="text-align: right;">
        <p style="font-weight: 700; margin: 0 0 4px;">Deliver To</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${order.customerName}</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${order.customerPhone}</p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${order.address.line1}</p>
        ${order.address.area ? `<p style="margin: 0; color: #6b7280; font-size: 12px;">${order.address.area}</p>` : ""}
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${order.address.city} - ${order.address.pincode}</p>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #374151;">Item</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #374151;">Qty</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #374151;">Weight</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #374151;">Price</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #374151;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((item) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 12px; font-size: 13px;">${item.product.name}</td>
            <td style="padding: 8px 12px; text-align: center; font-size: 13px;">${item.quantity}</td>
            <td style="padding: 8px 12px; text-align: center; font-size: 13px; color: #6b7280;">${item.selectedWeight || "-"}</td>
            <td style="padding: 8px 12px; text-align: right; font-size: 13px;">\u20B9${item.product.price}</td>
            <td style="padding: 8px 12px; text-align: right; font-size: 13px; font-weight: 600;">\u20B9${(item.product.price * item.quantity).toFixed(0)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div style="border-top: 2px solid #2D7D3A; padding-top: 16px; text-align: right;">
      <p style="margin: 0; font-size: 18px; font-weight: 800; color: #2D7D3A;">Total: \u20B9${order.total.toLocaleString()}</p>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Payment: ${order.paymentMethod.toUpperCase()} - ${order.paymentStatus}</p>
    </div>
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px;">
      <p style="margin: 0;">Siliguri Fresh Mart | Thank you for your order!</p>
    </div>
  `;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas.default(container, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = jsPDF.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    jsPDF.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    jsPDF.save(`invoice-${order.id}.pdf`);
  } finally {
    container.remove();
  }
}
