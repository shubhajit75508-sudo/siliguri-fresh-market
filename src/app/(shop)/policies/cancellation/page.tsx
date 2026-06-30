import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description: "How and when you can cancel an order placed on Siliguri Fresh Mart.",
};

const lastUpdated = "June 30, 2026";

export default function CancellationPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Cancellation Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        This policy explains how and when you can cancel an order placed on siligurifreshmart.com.
        This is separate from our Return and Replacement Policy, which applies after an order has been
        delivered.
      </p>

      <Section num="1" title="Cancelling Before Dispatch">
        <p>You may cancel your order <strong className="text-foreground">free of charge</strong> at any time before it has been packed/dispatched for delivery. To cancel, contact us as soon as possible with your order number.</p>
      </Section>

      <Section num="2" title="Cancelling After Dispatch">
        <p>Once an order has been dispatched for delivery, it generally cannot be cancelled, since fresh and perishable items are prepared and packed specifically for your order. If you no longer want the order after dispatch, please contact us and we will do our best to assist, but cancellation at this stage is not guaranteed.</p>
      </Section>

      <Section num="3" title="Cancellations by Siliguri Fresh Mart">
        <p>We reserve the right to cancel an order in situations such as:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Item unavailability or stock shortage</li>
          <li>Delivery address falling outside our serviceable area (Siliguri city)</li>
          <li>Inability to reach you for delivery confirmation</li>
          <li>Suspected fraudulent or incorrect order details</li>
        </ul>
        <p className="mt-2">If we cancel your order, you will be notified via phone, email, or WhatsApp, and any amount paid will be refunded.</p>
      </Section>

      <Section num="4" title="Refunds for Cancelled Orders">
        <p>Unlike our Return and Replacement Policy (which covers delivered items), a refund will be issued if an order is cancelled before delivery &mdash; either by you (before dispatch) or by us. Refunds will be processed to your original payment method within 5&ndash;7 business days.</p>
      </Section>

      <Section num="5" title="How to Cancel">
        <p>To cancel an order, contact us immediately with your order number:</p>
        <div className="mt-2 space-y-0.5">
          <p>Email: <a href="mailto:siligurifreshmart@gmail.com" className="text-[#2D7D3A] font-medium hover:underline">siligurifreshmart@gmail.com</a></p>
          <p>Phone/WhatsApp: <a href="tel:+917029908278" className="text-[#2D7D3A] font-medium hover:underline">+91 7029908278</a></p>
        </div>
      </Section>

      <Section num="6" title="Changes to This Policy">
        <p>We may update this Cancellation Policy from time to time. Changes will be posted on this page with a revised date.</p>
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
