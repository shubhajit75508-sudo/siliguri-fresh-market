"use client";

import { MessageCircle } from "lucide-react";
import { useCartStore, cartLineKey } from "@/store/cart-store";
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
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 hover:bg-[#1DA851] hover:shadow-[#25D366]/40 transition-all active:scale-95 sm:bottom-6"
      aria-label="Order on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
}
