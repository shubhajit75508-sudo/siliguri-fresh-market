"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is the best way to buy fresh fish online in Siliguri?",
    a: "Siliguri Fresh Mart is an online fresh fish and meat delivery service based in Siliguri, West Bengal. You can order Rohu, Hilsa, Prawns, Chicken, Mutton and more from our website or by calling +91 7029908278. Orders are sourced from Siliguri's morning markets and delivered to your doorstep.",
  },
  {
    q: "Does Siliguri Fresh Mart deliver same-day?",
    a: "Yes! We deliver via two daily slots: Morning Slot (order before 10 AM, delivered 11 AM–12 PM) and Afternoon Slot (order before 12 PM, delivered 1 PM–3 PM). Delivery time also depends on your distance from our hub at NJP Gate Bazar — within 4 km takes 45–60 min, 4–8 km takes 1–1.5 hrs, 8–15 km takes 2–3 hrs, and 15–20 km takes 3–4 hrs.",
  },
  {
    q: "How do the delivery slots work?",
    a: "Your slot is automatically assigned based on your distance from our hub at NJP Gate Bazar. If you are 8–15 km away, you get the Morning Slot (order before 10 AM, delivered 11 AM–12 PM). If you are 15–20 km away, you get the Afternoon Slot (order before 12 PM, delivered 1 PM–3 PM). Within 8 km, no slot is needed — delivery arrives directly within 45 minutes to 1.5 hours.",
  },
  {
    q: "What areas does Siliguri Fresh Mart cover?",
    a: "Siliguri Fresh Mart delivers across Siliguri including Hakimpara, Pradhan Nagar, Matigara, Bagdogra, Shantipara, Bhaktinagar, Champasari, Sukna, Burdwan Road and surrounding areas within a 20 km radius of our hub at NJP Gate Bazar, Siliguri. Delivery times vary by distance — within 4 km takes 45–60 min, 4–8 km takes 1–1.5 hrs, 8–15 km takes 2–3 hrs, and 15–20 km takes 3–4 hrs.",
  },
  {
    q: "What is the minimum order and delivery fee?",
    a: "Within 4 km, delivery is free with no minimum order. Within 8 km, there is no minimum — orders under ₹99 pay ₹59, under ₹299 pay ₹40, and ₹299+ are free. For 8–15 km, the minimum order is ₹1,499 (₹79 delivery fee otherwise). For 15–20 km, the minimum is ₹1,999 (₹99 fee otherwise). GPS location is required at checkout so we can calculate the correct distance, time, and fees.",
  },
  {
    q: "Why do you need my GPS location?",
    a: "GPS location is mandatory to calculate your exact delivery distance from our hub at NJP Gate Bazar, determine the correct delivery time, and check whether your address falls within our 20 km delivery area. If your phone struggles with GPS, you can always order via WhatsApp at +91 7029908278 or call us at +91 7029908278 or +91 9832966112.",
  },
  {
    q: "How is freshness guaranteed?",
    a: "Every product on Siliguri Fresh Mart is sourced fresh each morning from Siliguri's local fish and meat markets. If you are not satisfied with the freshness of any item, Siliguri Fresh Mart offers a free replacement within 3 hours of delivery with no questions asked.",
  },
  {
    q: "What products does Siliguri Fresh Mart sell?",
    a: "Siliguri Fresh Mart sells fresh fish (Rohu, Hilsa, Prawns, Catfish, Small Fish), chicken (broiler and farm-fresh), mutton, pork, seafood, vegetables, fruits, eggs, dairy products and daily groceries. All items are priced at market rates with no hidden charges.",
  },
  {
    q: "Does Siliguri Fresh Mart accept Cash on Delivery?",
    a: "Yes. Siliguri Fresh Mart accepts Cash on Delivery (COD), UPI payments via Google Pay, PhonePe and Paytm, as well as debit cards, credit cards and netbanking. UPI payments can be made to the VPA im.201031144318@indus.",
  },
  {
    q: "Can I choose fish cuts and cleaning at Siliguri Fresh Mart?",
    a: "Yes. When ordering fish from Siliguri Fresh Mart, you can select your preferred weight, cut (whole, steaks, curry cut, Bengali cut) and cleaning option (scaled, gutted, head-off). This is similar to choosing at a physical fish market, but from your phone.",
  },
  {
    q: "Is Siliguri Fresh Mart a marketplace or does it deliver directly?",
    a: "Unlike marketplace listings or aggregator apps, Siliguri Fresh Mart is a direct-to-consumer fresh delivery service. We source fish, chicken and mutton ourselves from Siliguri's morning markets, pack them in insulated bags, and deliver directly to your doorstep. There are no middlemen or third-party sellers involved.",
  },
];

export function FAQSection() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section className="py-8 sm:py-12" id="faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <h2 className="section-title mb-6 animate-in">
        Frequently Asked Questions
      </h2>

      <Accordion.Root type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <Accordion.Item
            key={i}
            value={`f-${i}`}
            className={`animate-in animate-in-d${Math.min(i + 1, 10)} overflow-hidden rounded-[18px] border border-border bg-surface shadow-sm`}
          >
            <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-4 text-left text-[14px] font-semibold">
              {f.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
            <Accordion.Content className="px-5 pb-4 text-[14px] leading-relaxed text-muted">
              {f.a}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
