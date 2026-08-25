import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema, FAQSchema } from "@/components/seo/schemas";

export const metadata: Metadata = {
  title: "Product Weight & Pricing Policy — Siliguri Fresh Mart",
  description:
    "Why fresh fish, chicken & mutton weight is measured before processing. Siliguri Fresh Mart transparent weight and pricing policy for doorstep delivery in Siliguri.",
  keywords: [
    "Siliguri Fresh Mart weight policy",
    "fresh fish weight after cleaning",
    "online fish delivery weight loss",
    "fresh meat pricing Siliguri",
    "grocery delivery weight policy India",
    "why fish weighs less after cleaning",
    "fresh chicken weight trimming",
    "online grocery pricing transparency",
  ],
  openGraph: {
    title: "Product Weight & Pricing Policy — Siliguri Fresh Mart",
    description:
      "Why fresh fish, chicken & mutton weight is measured before processing. Transparent weight and pricing policy.",
    url: "https://www.siligurifreshmart.com/policies/weight-pricing",
    type: "website",
  },
  alternates: {
    canonical: "https://www.siligurifreshmart.com/policies/weight-pricing",
  },
};

const lastUpdated = "August 25, 2026";

const faqs = [
  {
    question: "Why is the weight of fish or meat less than what I ordered?",
    answer:
      "Fresh fish, chicken, and mutton are sold by live/whole weight before cleaning and trimming. Scaling, gutting, removing skin, fat, and bone naturally reduces the final ready-to-cook weight by 5–15%. This is standard practice at every fresh market and quality grocer.",
  },
  {
    question: "How much weight do I lose after fish cleaning?",
    answer:
      "For fish, scaling, gutting, and cleaning typically remove 5–10% of the live weight. A 250g fish will yield approximately 210g–240g of cleaned, ready-to-cook fish.",
  },
  {
    question: "Why are Siliguri Fresh Mart prices higher than local markets?",
    answer:
      "Our prices include same-day freshness, doorstep delivery, quality checks on every order, and a replacement guarantee for damaged, spoiled, or missing items. You pay for the product plus the certainty that comes with it.",
  },
  {
    question: "Do you inflate the live weight to compensate for cleaning loss?",
    answer:
      "No. We charge based on the exact live/whole weight we source. We never inflate live weight to offset natural processing loss. The weight and price you are charged reflect exactly what we purchased for your order.",
  },
  {
    question: "Is the weight loss after cleaning unique to Siliguri Fresh Mart?",
    answer:
      "No. Weight reduction after cleaning fresh fish, chicken, or meat is a natural and universal process — it happens at every local market, butcher shop, and quality grocer. We simply tell you upfront so there are no surprises.",
  },
  {
    question: "What if I receive significantly less weight than expected?",
    answer:
      "If you believe there is an issue with your order weight beyond normal processing loss, contact us within 2 hours 59 minutes of delivery. We will review your case and arrange a replacement if appropriate.",
  },
];

const breadcrumbItems = [
  { name: "Home", url: "/" },
  { name: "Policies", url: "/policies/privacy" },
  { name: "Weight & Pricing", url: "/policies/weight-pricing" },
];

export default function WeightPricingPolicyPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema questions={faqs} />

      <nav className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-[#2D7D3A] transition-colors">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/policies/privacy" className="hover:text-[#2D7D3A] transition-colors">Policies</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground font-medium">Weight &amp; Pricing</span>
      </nav>

      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Product Weight &amp; Pricing Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        At Siliguri Fresh Mart, we believe in complete transparency about how fresh products are weighed, priced,
        and delivered. This policy explains why the weight you receive may differ from what you ordered, and why
        our prices reflect the quality and service you get.
      </p>

      <Section num="1" title="About Product Weight">
        <p>
          All our fresh products &mdash; fish, chicken, mutton, or any item that requires cleaning, trimming, or preparation &mdash;
          are priced and sold based on their <strong className="text-foreground">live/whole weight at the time of purchase</strong>,
          not the final weight after processing.
        </p>
        <p>Here&apos;s why the weight you receive is often less than what you ordered:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong className="text-foreground">Fish:</strong> Scaling, gutting, and cleaning naturally remove weight. A 250g fish will typically yield 210g&ndash;240g of cleaned, ready-to-cook fish.</li>
          <li><strong className="text-foreground">Chicken &amp; Meat:</strong> Removing skin, fat, bone, or trimmings as per your chosen cut reduces the final weight similarly &mdash; usually in the same 5&ndash;15% range.</li>
          <li><strong className="text-foreground">Vegetables &amp; Fruits:</strong> Where applicable, trimming, peeling, or removing spoiled portions may also result in minor weight differences.</li>
        </ul>
        <p className="mt-2">
          This isn&apos;t something unique to us &mdash; it&apos;s how fresh food works everywhere, from your local market
          to any quality grocer. The difference is that we tell you upfront, so there are no surprises at your doorstep.
          The weight and price you&apos;re charged reflect exactly what we sourced &mdash; we never inflate live weight
          to offset this natural loss.
        </p>
      </Section>

      <Section num="2" title="Why Our Prices Are Higher">
        <p>We&apos;re not the cheapest option in Siliguri, and we don&apos;t try to be. Here&apos;s what you&apos;re actually paying for:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong className="text-foreground">Same-day freshness</strong> &mdash; nothing sits in storage for days waiting for a buyer.</li>
          <li><strong className="text-foreground">Doorstep delivery</strong> &mdash; no travel, no bargaining, no standing in line at the bazaar.</li>
          <li><strong className="text-foreground">Quality checks on every order</strong> &mdash; before it ever reaches your door.</li>
          <li><strong className="text-foreground">A real replacement guarantee</strong> &mdash; if anything arrives damaged, spoiled, wrong, or missing, we replace it. That promise costs us on the back end, and it&apos;s already factored into our pricing &mdash; not an extra you pay for later.</li>
        </ul>
        <p className="mt-2">
          In short: our price isn&apos;t just for the product &mdash; it&apos;s for the certainty that comes with it.
          Certainty it&apos;s fresh, certainty it&apos;s handled properly, and certainty that if something goes wrong, we fix it.
        </p>
      </Section>

      <Section num="3" title="Related Policies">
        <ul className="list-disc pl-5 space-y-1">
          <li><Link href="/policies/returns" className="text-[#2D7D3A] font-medium hover:underline">Return &amp; Replacement Policy</Link></li>
          <li><Link href="/policies/shipping" className="text-[#2D7D3A] font-medium hover:underline">Shipping &amp; Delivery Policy</Link></li>
          <li><Link href="/policies/cancellation" className="text-[#2D7D3A] font-medium hover:underline">Cancellation Policy</Link></li>
        </ul>
      </Section>

      <Section num="4" title="Frequently Asked Questions">
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-foreground">{faq.question}</h3>
              <p className="text-sm text-muted leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="space-y-0.5 mt-8 pt-6 border-t border-border">
        <p className="text-sm text-muted">Email: <a href="mailto:siligurifreshmart@gmail.com" className="text-[#2D7D3A] font-medium hover:underline">siligurifreshmart@gmail.com</a></p>
        <p className="text-sm text-muted">Phone: <a href="tel:+917029908278" className="text-[#2D7D3A] font-medium hover:underline">+91 7029908278</a></p>
      </div>
    </>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-foreground mb-2">{num}. {title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
