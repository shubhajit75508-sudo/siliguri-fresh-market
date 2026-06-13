"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "How fast is delivery?", a: "10–30 minutes across Siliguri. Fish and meat orders are always prioritised." },
  { q: "How do you ensure freshness?", a: "Daily sourcing from local markets with freshness scores and catch dates on every item." },
  { q: "Can I choose fish cuts and cleaning?", a: "Yes — pick species, weight, cut, and cleaning just like at the market." },
  { q: "What is SFM Prime?", a: "₹99/month for free delivery, exclusive discounts, and priority support." },
];

export function FAQSection() {
  return (
    <section className="py-8 sm:py-12" id="faq">
      <h2 className="section-title mb-6 animate-in">
        Questions & answers
      </h2>

      <Accordion.Root type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <Accordion.Item
            key={i}
            value={`f-${i}`}
            className={`animate-in animate-in-d${Math.min(i + 1, 10)} overflow-hidden rounded-[18px] border border-border bg-white shadow-sm`}
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
