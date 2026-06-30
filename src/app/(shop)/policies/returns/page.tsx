import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Replacement Policy",
  description: "Siliguri Fresh Mart return policy — 2:59 hour replacement window for damaged, spoiled, or missing items.",
};

const lastUpdated = "June 30, 2026";

export default function ReturnPolicyPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Return &amp; Replacement Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        At Siliguri Fresh Mart, we want every order to arrive correct and in good condition. Because we deal
        primarily in groceries and fresh produce, our policy is built around quick replacement rather than
        refunds, given the perishable nature of our products.
      </p>

      <Section num="1" title="Replacement Window">
        <p>You may request a replacement within <strong className="text-foreground">2 hours and 59 minutes (2:59)</strong> of delivery if:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>You received a damaged, spoiled, or defective item</li>
          <li>You received the wrong item or quantity</li>
          <li>An item was missing from your delivered order</li>
        </ul>
        <p className="mt-2">Requests made after this 2:59 window will generally not be eligible for replacement, since freshness and condition cannot be verified after that time.</p>
      </Section>

      <Section num="2" title="No Standard Refunds">
        <p>Siliguri Fresh Mart does not offer refunds as a standard remedy. Issues reported within the eligible window are resolved through <strong className="text-foreground">replacement</strong> of the item(s) in question, not a monetary refund.</p>
      </Section>

      <Section num="3" title="Refunds in Extreme Cases">
        <p>In rare or extreme circumstances &mdash; for example, where replacement is not possible, the order cannot be fulfilled again, or another genuine emergency applies &mdash; a refund may be considered at our discretion. To request this:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>You must contact us directly and explain the emergency situation</li>
          <li>Our team will review the case individually</li>
          <li>Approval of refund requests is at the sole discretion of Siliguri Fresh Mart and is not guaranteed</li>
        </ul>
      </Section>

      <Section num="4" title="How to Request a Replacement">
        <p>Contact us within 2 hours 59 minutes of delivery with:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Your order number</li>
          <li>A photo of the damaged, wrong, or missing item (where applicable)</li>
          <li>A brief description of the issue</li>
        </ul>
      </Section>

      <Section num="5" title="Non-Returnable Items">
        <ul className="list-disc pl-5 space-y-1">
          <li>Items reported after the 2:59 window</li>
          <li>Fresh produce, dairy, or perishables once accepted in good condition and later used or opened</li>
          <li>Issues not related to damage, wrong item, or missing item (e.g. personal taste or preference)</li>
        </ul>
      </Section>

      <Section num="6" title="Review Process">
        <p>Once we receive your request within the window, our team will review the details (and photos, where provided) promptly and arrange a replacement in your next available delivery slot, where approved.</p>
      </Section>

      <Section num="7" title="Changes to This Policy">
        <p>We may update this Return and Replacement Policy from time to time. Any changes will be posted on this page with a revised date.</p>
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
