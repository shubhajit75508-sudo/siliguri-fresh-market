import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Weight & Pricing Policy",
  description: "Siliguri Fresh Mart weight and pricing policy — understand how fresh product weights are measured and why our prices reflect quality, freshness, and guaranteed delivery.",
};

const lastUpdated = "August 25, 2026";

export default function WeightPricingPolicyPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Product Weight &amp; Pricing Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

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
