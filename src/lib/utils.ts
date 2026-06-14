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

export function getAvailableWeights(_price: number, category: string): string[] {
  if (category === "fish" || category === "chicken" || category === "mutton") {
    return ["500g", "1kg", "1.5kg", "2kg"];
  }
  return ["250g", "500g", "1kg"];
}
