import type { Metadata } from "next";
import { HomeClient } from "./home-client";
import { homeFaqs } from "@/lib/home-faqs";

const url = "https://www.siligurifreshmart.com";

export const metadata: Metadata = {
  title: "Fresh Fish, Chicken, Mutton & Vegetables Delivery in Siliguri | Siliguri Fresh Mart",
  description:
    "Order fresh fish (rohu, katla, hilsa, prawns), chicken, mutton, vegetables, fruits & daily essentials online in Siliguri. Direct from local market, cut to order, delivered to your doorstep. Free delivery above ₹299.",
  alternates: {
    canonical: url + "/",
  },
  openGraph: {
    title: "Fresh Fish, Chicken, Mutton & Vegetables Delivery in Siliguri | Siliguri Fresh Mart",
    description:
      "Order fresh fish (rohu, katla, hilsa, prawns), chicken, mutton, vegetables, fruits & daily essentials online in Siliguri. Direct from local market, cut to order, delivered to your doorstep.",
    url: url + "/",
    siteName: "Siliguri Fresh Mart",
    type: "website",
    locale: "en_IN",
  },
};

export default function HomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HomeClient />
    </>
  );
}
