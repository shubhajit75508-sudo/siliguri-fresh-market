import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Siliguri Fresh Mart collects, uses, and protects your personal information.",
};

const lastUpdated = "June 30, 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Privacy Policy</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        Siliguri Fresh Mart (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the website
        siligurifreshmart.com. This Privacy Policy explains what information we collect from you,
        how we use it, and the choices you have.
      </p>

      <Section num="1" title="Information We Collect">
        <p>When you use our website or place an order, we may collect:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Name, phone number, and email address</li>
          <li>Delivery address (within Siliguri city)</li>
          <li>Order history and items purchased</li>
          <li>Payment information processed through our payment gateway (we do not store your card, UPI, or banking details on our own servers)</li>
          <li>Basic technical data such as IP address and browser type, for site security and performance</li>
        </ul>
      </Section>

      <Section num="2" title="How We Use Your Information">
        <p>We use the information collected to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Process and deliver your orders</li>
          <li>Contact you about order status, delivery updates, or issues</li>
          <li>Respond to customer support queries</li>
          <li>Improve our website and product offerings</li>
          <li>Comply with legal and tax obligations</li>
        </ul>
      </Section>

      <Section num="3" title="Sharing of Information">
        <p>We do not sell your personal information. We may share necessary details (such as your name, address, and phone number) with:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Our delivery personnel, solely to complete your order delivery</li>
          <li>Payment gateway providers, to process transactions securely</li>
          <li>Government or legal authorities, only if required by law</li>
        </ul>
      </Section>

      <Section num="4" title="Cookies">
        <p>Our website may use basic cookies to remember your cart items and improve your browsing experience. You can disable cookies in your browser settings, though some site features may not work properly.</p>
      </Section>

      <Section num="5" title="Data Security">
        <p>We take reasonable steps to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.</p>
      </Section>

      <Section num="6" title="Your Rights">
        <p>You may contact us at any time to access, correct, or request deletion of your personal information, subject to any legal record-keeping requirements (such as order/tax records).</p>
      </Section>

      <Section num="7" title="Children&apos;s Privacy">
        <p>Our website is intended for use by individuals 18 years and older. We do not knowingly collect personal information from children.</p>
      </Section>

      <Section num="8" title="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.</p>
      </Section>

      <Section num="9" title="Contact Us">
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ContactInfo />
      </Section>
    </>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-foreground mb-2">
        {num}. {title}
      </h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function ContactInfo() {
  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-sm text-muted">Email: <a href="mailto:siligurifreshmart@gmail.com" className="text-[#2D7D3A] font-medium hover:underline">siligurifreshmart@gmail.com</a></p>
      <p className="text-sm text-muted">Phone: <a href="tel:+917029908278" className="text-[#2D7D3A] font-medium hover:underline">+91 7029908278</a></p>
    </div>
  );
}
