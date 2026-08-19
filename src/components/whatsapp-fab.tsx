"use client";

import { useCartStore } from "@/store/cart-store";
import { formatPrice, getWeightMultiplier } from "@/lib/utils";

const STORE_PHONE = "917029908278";

function buildOrderMessage(): string {
  const { items, getSubtotal, getDeliveryFee } = useCartStore.getState();
  if (items.length === 0) {
    return "Hi Siliguri Freshmart! I'd like to place an order.";
  }

  const lines = items.map((item, idx) => {
    const weight = item.selectedWeight || item.product.unit;
    const unitPrice = item.product.price * getWeightMultiplier(item.selectedWeight);
    const lineTotal = unitPrice * item.quantity;
    const extras = [item.selectedCut, item.selectedCleaning].filter(Boolean).join(", ");
    return `${idx + 1}. ${item.product.name} (${weight}) x ${item.quantity} - ${formatPrice(lineTotal)}${extras ? ` [${extras}]` : ""}`;
  });

  const subtotal = getSubtotal();
  const delivery = getDeliveryFee();
  const total = subtotal + delivery;

  lines.push("");
  lines.push(`Subtotal: ${formatPrice(subtotal)}`);
  lines.push(`Delivery: ${delivery === 0 ? "FREE" : formatPrice(delivery)}`);
  lines.push(`Total: ${formatPrice(total)}`);

  return lines.join("\n");
}

export function WhatsAppFab() {
  const handleClick = () => {
    const msg = buildOrderMessage();
    window.open(`https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-22 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_14px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.5)] hover:bg-[#20BA5C] transition-all active:scale-90 sm:bottom-6"
      aria-label="Order on WhatsApp"
    >
      <svg viewBox="0 0 32 32" fill="white" className="h-7 w-7">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.054 9.374L1.054 31.25l6.098-1.97A15.906 15.906 0 0016.004 32C24.83 32 32 24.822 32 16S24.83 0 16.004 0zm9.308 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.84.18-1.938.324-5.636-1.21-4.736-1.966-7.78-6.81-8.016-7.126-.226-.316-1.896-2.524-1.896-4.814s1.2-3.41 1.63-3.878c.39-.424.936-.572 1.248-.572.152 0 .29.008.416.014.434.018.65.044.936.716.35.84 1.198 2.924 1.302 3.138.104.214.214.52.064.834-.138.326-.258.526-.472.814-.214.288-.42.512-.634.822-.194.276-.41.572-.17.996.238.424 1.06 1.75 2.274 2.836 1.562 1.396 2.838 1.83 3.288 2.036.336.154.734.092.994-.276.332-.468.74-1.236 1.15-1.982.294-.534.666-.6 1.132-.404.378.158 2.398 1.132 2.81 1.338.414.206.69.31.794.484.104.174.104 1.006-.286 2.106z" />
      </svg>
    </button>
  );
}
