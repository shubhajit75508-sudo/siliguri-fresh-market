import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "How Siliguri Fresh Mart delivers your orders within Siliguri city limits.",
};

const lastUpdated = "June 30, 2026";

export default function ShippingPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Shipping &amp; Delivery Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        This policy explains how we deliver orders placed on siligurifreshmart.com.
      </p>

      <Section num="1" title="Delivery Area">
        <p>We currently deliver only within <strong className="text-foreground">Siliguri city limits</strong>. If your address falls outside our serviceable area, your order may be cancelled and refunded/not processed, and you will be notified at checkout or shortly after.</p>
      </Section>

      <Section num="2" title="Delivery Timelines">
        <p>Delivery timelines are estimates and may vary based on order volume, weather, traffic, or stock availability. We aim to deliver orders as promptly as possible within Siliguri city, and timing details will be communicated at checkout or via order confirmation.</p>
      </Section>

      <Section num="3" title="Delivery Charges">
        <p>Any applicable delivery charges will be clearly shown at checkout before you confirm your order. We may offer free delivery above certain order values, which will be indicated on the website.</p>
      </Section>

      <Section num="4" title="Order Tracking and Confirmation">
        <p>You will receive confirmation of your order and delivery status via phone, email, or WhatsApp using the contact details you provide at checkout.</p>
      </Section>

      <Section num="5" title="Failed or Delayed Deliveries">
        <ul className="list-disc pl-5 space-y-1">
          <li>If you are unavailable to receive the order at the provided address, our delivery person will attempt to contact you. Repeated failure to reach you or receive the order may result in the order being cancelled.</li>
          <li>Please ensure your address and phone number are accurate at the time of ordering. We are not responsible for failed deliveries due to incorrect or incomplete address details provided by you.</li>
        </ul>
      </Section>

      <Section num="6" title="Inspection at Delivery">
        <p>We strongly recommend checking your order at the time of delivery wherever possible, since our Return and Replacement Policy requires issues to be reported within 2 hours 59 minutes of delivery.</p>
      </Section>

      <Section num="7" title="Changes to This Policy">
        <p>We may update this Shipping and Delivery Policy from time to time. Changes will be posted on this page with a revised date.</p>
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
