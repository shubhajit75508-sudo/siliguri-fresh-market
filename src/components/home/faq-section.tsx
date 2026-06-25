"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How fast is delivery?", a: "Most orders are delivered within 30–45 minutes across Siliguri. Fish and meat items are prioritised for freshness." },
  { q: "Is delivery free?", a: "Yes! Delivery is free on all orders above ₹299. A small ₹40 fee applies for orders under ₹299." },
  { q: "How do you ensure freshness?", a: "We source daily from Siliguri's local markets. Every product shows its freshness score and catch/source date." },
  { q: "Can I choose fish cuts and cleaning?", a: "Absolutely — select your species, weight, cut (whole, steaks, curry cut), and cleaning preference just like at the market." },
  { q: "What if I receive a damaged or spoiled item?", a: "No worries — you can request a replacement within 3 hours of delivery. Just go to your order and tap Request Replacement." },
  { q: "How do I cancel my order?", a: "You can cancel anytime before the order is packed. Once it's picked up for delivery, cancellations are not available." },
  { q: "What payment methods do you accept?", a: "We accept UPI, credit/debit cards, netbanking, wallets via Razorpay, and Cash on Delivery." },
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
        Questions & answers
      </h2>

      <Accordion.Root type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <Accordion.Item
            key={i}
            value={`f-${i}`}
            className={`animate-in animate-in-d${Math.min(i + 1, 10)} overflow-hidden rounded-[18px] border border-border bg-[#0d1b2a] shadow-sm`}
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
