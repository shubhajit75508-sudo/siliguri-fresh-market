import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siliguri Fresh Mart — Fresh Fish, Chicken, Mutton Delivered to Your Door",
  description:
    "Premium fresh fish, chicken, mutton, vegetables & groceries delivered to your doorstep in Siliguri. Same-day freshness guaranteed.",
  openGraph: {
    title: "Siliguri Fresh Mart — Fresh Fish, Chicken, Mutton Delivered",
    description: "Premium fresh fish, chicken, mutton, vegetables & groceries delivered in Siliguri.",
    url: "https://www.siligurifreshmart.com",
    type: "website",
  },
  alternates: { canonical: "https://www.siligurifreshmart.com" },
};

export default function LandingPage() {
  return <LandingClient />;
}

import LandingClient from "./client";
