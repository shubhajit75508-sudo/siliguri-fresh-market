"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { homeFaqs as faqs } from "@/lib/home-faqs";

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
