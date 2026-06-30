import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions governing the use of Siliguri Fresh Mart services.",
};

const lastUpdated = "June 30, 2026";

export default function TermsPage() {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#2D7D3A] mb-2">Legal</p>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1">Terms &amp; Conditions</h1>
      <p className="text-xs text-muted mb-8">Last updated: {lastUpdated}</p>

      <p className="text-sm text-muted leading-relaxed mb-6">
        Welcome to Siliguri Fresh Mart (siligurifreshmart.com). By accessing or using our website and placing
        an order, you agree to be bound by these Terms and Conditions. Please read them carefully before
        using our services.
      </p>

      <Section num="1" title="About Us">
        <p>Siliguri Fresh Mart is an online grocery and fresh produce delivery service operating within Siliguri city. We are currently operating as an individual proprietorship; business registration details will be updated here once formalized.</p>
      </Section>

      <Section num="2" title="Eligibility">
        <p>You must be at least 18 years old to place an order on our website. By placing an order, you confirm that you meet this requirement and that the information you provide is accurate.</p>
      </Section>

      <Section num="3" title="Orders">
        <ul className="list-disc pl-5 space-y-1">
          <li>All orders are subject to acceptance and availability of stock.</li>
          <li>We reserve the right to refuse or cancel any order at our discretion, including in cases of pricing errors, suspected fraud, or unavailability of items.</li>
          <li>Order confirmation will be sent via phone, email, or WhatsApp once your order is accepted.</li>
        </ul>
      </Section>

      <Section num="4" title="Pricing and Payment">
        <ul className="list-disc pl-5 space-y-1">
          <li>All prices are listed in Indian Rupees (INR) and are subject to change without prior notice.</li>
          <li>Payment can be made through the available payment methods on our website (UPI, cards, net banking, or cash on delivery where applicable).</li>
          <li>In case of a pricing error on the website, we reserve the right to cancel the order and issue a full refund.</li>
        </ul>
      </Section>

      <Section num="5" title="Delivery">
        <ul className="list-disc pl-5 space-y-1">
          <li>We currently deliver only within Siliguri city limits.</li>
          <li>Delivery timelines provided are estimates and may vary due to weather, traffic, stock, or other unforeseen circumstances.</li>
          <li>Please refer to our separate Shipping/Delivery Policy for full details.</li>
        </ul>
      </Section>

      <Section num="6" title="Cancellations and Returns">
        <p>Order cancellations and returns are governed by our separate Cancellation Policy and Return Policy, which form part of these Terms.</p>
      </Section>

      <Section num="7" title="Product Information">
        <p>We make reasonable efforts to display accurate product descriptions, images, and pricing. However, slight variations in product appearance (especially fresh produce) may occur, and we do not guarantee that all information is error-free at all times.</p>
      </Section>

      <Section num="8" title="Limitation of Liability">
        <p>To the maximum extent permitted by law, Siliguri Fresh Mart shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products, except in cases of proven negligence on our part.</p>
      </Section>

      <Section num="9" title="User Conduct">
        <p>You agree not to misuse the website, attempt unauthorized access to our systems, or use the platform for any unlawful purpose.</p>
      </Section>

      <Section num="10" title="Intellectual Property">
        <p>All content on this website, including logos, text, and images, is the property of Siliguri Fresh Mart unless otherwise stated, and may not be used without permission.</p>
      </Section>

      <Section num="11" title="Governing Law">
        <p>These Terms are governed by the laws of India. Any disputes arising from the use of this website or our services shall be subject to the jurisdiction of the courts in Siliguri, West Bengal.</p>
      </Section>

      <Section num="12" title="Changes to Terms">
        <p>We may update these Terms and Conditions from time to time. Continued use of the website after changes are posted constitutes your acceptance of the updated Terms.</p>
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
