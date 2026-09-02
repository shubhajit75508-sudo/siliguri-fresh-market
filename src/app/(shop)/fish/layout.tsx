import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Fresh Fish Online in Siliguri | Rohu, Katla, Hilsa, Prawns | Home Delivery",
  description:
    "Order fresh fish online in Siliguri. Rohu, Katla, Hilsa, Pomfret, Prawns & more. Free delivery on all orders. Cut & clean to order. Fresh from local rivers to your doorstep.",
  keywords: [
    "fresh fish delivery Siliguri",
    "rohu fish online Siliguri",
    "katla fish home delivery",
    "hilsa fish Siliguri",
    "prawns delivery Siliguri",
    "fish online order",
  ],
  openGraph: {
    title: "Buy Fresh Fish Online in Siliguri | Siliguri Fresh Mart",
    description:
      "Fresh river catch delivered daily. Rohu, Katla, Hilsa, Pomfret, Prawns. Free delivery on all orders.",
  },
};

export default function FishLayout({ children }: { children: React.ReactNode }) {
  return children;
}