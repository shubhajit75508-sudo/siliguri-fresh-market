import type { Metadata } from "next";
import { BulkOrderClient } from "./client";

export const metadata: Metadata = {
  title: "Bulk Order Fresh Fish & Meat | Hotels, Restaurants & Events — Siliguri Fresh Mart",
  description:
    "Order fresh fish, chicken, mutton, seafood and more in bulk for hotels, restaurants, weddings and events in Siliguri. Best wholesale prices, delivered fresh to your doorstep.",
  alternates: { canonical: "https://www.siligurifreshmart.com/bulk" },
  openGraph: {
    title: "Bulk Order Fresh Fish & Meat — Siliguri Fresh Mart",
    description: "Fresh fish, chicken, mutton & seafood in bulk for hotels, restaurants, weddings & events. Siliguri's trusted fresh market.",
    url: "https://www.siligurifreshmart.com/bulk",
  },
};

export default function BulkOrderPage() {
  return <BulkOrderClient />;
}
