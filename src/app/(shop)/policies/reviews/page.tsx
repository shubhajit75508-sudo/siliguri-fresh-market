import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews & Ratings",
  description: "How Siliguri Fresh Mart collects and verifies customer reviews and ratings at delivery.",
};

const lastUpdated = "June 30, 2026";

export default function ReviewsPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Reviews &amp; Ratings Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        All reviews on Siliguri Freshmart are verified. We collect feedback directly from customers at the time of delivery — no fake or anonymous reviews.
      </p>
      <p className="text-sm text-muted leading-relaxed mb-6">
        At Siliguri Freshmart, we believe in complete transparency. Every review and rating displayed on our website is real, verified, and collected in person — not submitted anonymously online.
      </p>

      <Section num="1" title="How We Collect Reviews">
        <p>Our delivery personnel collect feedback directly from customers at the time of delivery. After handing over your order, our delivery person will ask you a few simple questions about your experience — product quality, freshness, delivery speed, and overall satisfaction — and record your rating and comments on your behalf.</p>
      </Section>

      <Section num="2" title="Verified Buyers Only">
        <p>Only customers who have received a completed delivery are asked for a review. We do not accept or publish reviews from anyone who has not made a purchase and received their order from us. This means every rating you see on our site reflects a genuine, completed transaction.</p>
      </Section>

      <Section num="3" title="No Fake or Incentivised Reviews">
        <p>We do not publish, create, or pay for fake reviews. We do not offer discounts, free products, or any other incentive in exchange for a positive review. What you see is what real customers said about real orders.</p>
      </Section>

      <Section num="4" title="Honest Feedback">
        <p>Negative feedback is also recorded and taken seriously. We do not filter out or delete genuine negative reviews. If a customer was unhappy with their order, that feedback is noted and used to improve our service.</p>
      </Section>

      <Section num="5" title="What We Record">
        <p>The review collected at delivery typically includes:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Star rating (out of 5)</li>
          <li>Comments on product freshness and quality</li>
          <li>Feedback on delivery speed and packaging</li>
          <li>Overall experience rating</li>
        </ul>
      </Section>

      <Section num="6" title="Customer Consent">
        <p>Participation in our review process is completely voluntary. Customers are not pressured or obligated to give a rating at the time of delivery. If you prefer not to give feedback, you can simply decline — your order service will not be affected in any way.</p>
      </Section>

      <Section num="7" title="Disputes or Corrections">
        <p>If you believe a review attributed to your order was recorded incorrectly, please contact us and we will verify and correct it.</p>
      </Section>

      <Section num="8" title="Changes to This Policy">
        <p>We may update this Reviews and Ratings Policy from time to time. Changes will be posted on this page with a revised date.</p>
      </Section>

      <div className="space-y-0.5 mt-8 pt-6 border-t border-border">
        <p className="text-sm text-muted">Email: <a href="mailto:siligurifreshmart@gmail.com" className="text-[#2D7D3A] font-medium hover:underline">siligurifreshmart@gmail.com</a></p>
        <p className="text-sm text-muted">Phone/WhatsApp: <a href="tel:+917029908278" className="text-[#2D7D3A] font-medium hover:underline">+91 7029908278</a></p>
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