import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDiscount(original: number, current: number): number {
  if (original === 0) return 0;
  return Math.round(((original - current) / original) * 100);
}

/** Parse weight string like "500g", "1.5kg", "2kg" into a multiplier relative to 1kg. */
export function getWeightMultiplier(weight?: string): number {
  if (!weight) return 1;
  const trimmed = weight.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|kg)$/);
  if (!match) return 1;
  const val = parseFloat(match[1]);
  const unit = match[2];
  return unit === "g" ? val / 1000 : val;
}

export function getAvailableWeights(_price: number, category: string, customWeights?: string[], weightPrices?: { weight: string; price: number }[]): string[] {
  if (weightPrices && weightPrices.length > 0) return weightPrices.map(w => w.weight);
  if (customWeights && customWeights.length > 0) return customWeights;
  if (category === "fish" || category === "chicken" || category === "mutton") {
    return ["500g", "1kg", "1.5kg", "2kg"];
  }
  return ["250g", "500g", "1kg"];
}

/** Get the price for a specific weight from weightPrices, or fall back to base price * multiplier */
export function getPriceForWeight(basePrice: number, weight: string | undefined, weightPrices?: { weight: string; price: number }[]): number {
  const norm = weight?.trim().toLowerCase() ?? "";
  if (weightPrices) {
    const match = weightPrices.find(w => w.weight.toLowerCase() === norm);
    if (match) return match.price;
  }
  return basePrice * getWeightMultiplier(norm);
}

/** Get the original (pre-discount) price for a weight, scaled proportionally */
export function getOriginalPriceForWeight(basePrice: number, originalPrice: number | undefined, weight: string, weightPrices?: { weight: string; price: number }[]): number | undefined {
  if (!originalPrice || originalPrice <= basePrice) return undefined;
  const ratio = originalPrice / basePrice;
  return Math.round(getPriceForWeight(basePrice, weight, weightPrices) * ratio);
}

interface WeightPriceInput {
  price: number;
  weightPrices?: { weight: string; price: number }[];
}

/** Per-unit price of an order line item, honoring the server-computed unitPrice,
 *  then weightPrices, and finally the linear weight multiplier. */
export function getItemUnitPrice(item: {
  unitPrice?: number;
  product?: WeightPriceInput;
  selectedWeight?: string;
}): number {
  if (typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) && item.unitPrice > 0) {
    return item.unitPrice;
  }
  return getPriceForWeight(item.product?.price ?? 0, item.selectedWeight, item.product?.weightPrices);
}

/** Line total (unit price × quantity) for an order line item. */
export function getItemLineTotal(item: {
  unitPrice?: number;
  product?: WeightPriceInput;
  selectedWeight?: string;
  quantity?: number;
}): number {
  return getItemUnitPrice(item) * (item.quantity ?? 1);
}
