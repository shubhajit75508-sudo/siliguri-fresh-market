import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Siliguri Fresh Mart",
  description:
    "Siliguri Fresh Mart delivery policy: NJP Gate Bazar hub, 20 km delivery area, distance-based time and fees, mandatory GPS location.",
  keywords:
    "Siliguri Fresh Mart shipping, delivery policy, Siliguri home delivery, NJP Gate Bazar delivery, Siliguri grocery delivery rules",
  openGraph: {
    title: "Shipping & Delivery Policy | Siliguri Fresh Mart",
    description:
      "Learn how Siliguri Fresh Mart delivers across 20 km from NJP Gate Bazar: distance-based ETAs, delivery fees, and why GPS location is required.",
    url: "https://siliguri-freshmart.com/policies/shipping",
    siteName: "Siliguri Fresh Mart",
  },
  alternates: { canonical: "https://siliguri-freshmart.com/policies/shipping" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How far does Siliguri Fresh Mart deliver?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We deliver within 20 km of our hub at NJP Gate Bazar, Siliguri. This covers most of Siliguri city including Sevoke Road, Matigara, Bagdogra, Pradhan Nagar, and surrounding areas.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a delivery fee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Within 4 km, delivery is free with no minimum order. Within 8 km, delivery is free — orders under ₹99 pay ₹59, orders under ₹299 pay ₹40, and ₹299+ are free. For 8–15 km, there is a ₹79 delivery fee unless your order is ₹800 or more. For 15–20 km, the fee is ₹99 unless your order is ₹1,499 or more.",
      },
    },
    {
      "@type": "Question",
      name: "What is the minimum order for delivery?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Within 8 km, there is no minimum order. For 8–15 km, the minimum order is ₹800. For 15–20 km, the minimum is ₹1,499. If your order is below the minimum, a small delivery fee applies instead.",
      },
    },
    {
      "@type": "Question",
      name: "Why do you need my GPS location?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GPS location is mandatory to calculate your exact delivery distance, time estimate, and applicable fees. Without it, we cannot verify that your address falls within our 20 km delivery area. If you are struggling to share location, you can always order via WhatsApp at +91 7029908278 or call us at +91 7029908278 or +91 9832966112.",
      },
    },
    {
      "@type": "Question",
      name: "What if I cannot share my location?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If your phone cannot detect GPS, you can place your order via WhatsApp or phone call. Our team will help you confirm your address manually. WhatsApp: +91 7029908278. Call: +91 7029908278 or +91 9832966112.",
      },
    },
    {
      "@type": "Question",
      name: "When does delivery start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We deliver daily from 7 AM to 3 PM. Orders placed before 11 AM are delivered the same day (subject to time slot availability). Orders placed after 11 AM may be delivered the same day or scheduled for the next available slot. Delivery time depends on your distance from NJP Gate Bazar.",
      },
    },
  ],
};

export default function ShippingPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-background px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
            <a href="/" className="hover:text-foreground">
              Home
            </a>
            <span>/</span>
            <span className="font-medium text-foreground">Shipping & Delivery</span>
          </nav>

          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            Shipping & Delivery Policy
          </h1>
          <p className="mb-10 text-sm text-muted">
            <strong>Effective date:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Hub Card */}
          <div className="mb-8 rounded-2xl bg-card border border-border p-6">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Our Hub</p>
            <p className="text-lg font-bold text-foreground">NJP Gate Bazar, Siliguri</p>
            <p className="text-sm text-muted mt-1">All deliveries are dispatched from this location. Delivery times and fees are calculated based on your distance from this hub.</p>
          </div>

          {/* Delivery Radius */}
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold text-foreground">Delivery Area</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              We currently deliver within <strong>20 km</strong> of our hub at NJP Gate Bazar, Siliguri.
              Delivery times and charges depend on your exact distance from the hub.
            </p>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      <th className="px-5 py-3 text-xs font-bold text-foreground">Distance</th>
                      <th className="px-5 py-3 text-xs font-bold text-foreground">Est. Time</th>
                      <th className="px-5 py-3 text-xs font-bold text-foreground">Min Order</th>
                      <th className="px-5 py-3 text-xs font-bold text-foreground">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="px-5 py-3 text-sm font-medium">Within 1 km</td><td className="px-5 py-3 text-sm">10–20 min</td><td className="px-5 py-3 text-sm">None</td><td className="px-5 py-3 text-sm">Free</td></tr>
                    <tr><td className="px-5 py-3 text-sm font-medium">1–4 km</td><td className="px-5 py-3 text-sm">20–30 min</td><td className="px-5 py-3 text-sm">None</td><td className="px-5 py-3 text-sm">Free</td></tr>
                    <tr><td className="px-5 py-3 text-sm font-medium">4–8 km</td><td className="px-5 py-3 text-sm">45–60 min</td><td className="px-5 py-3 text-sm">None</td><td className="px-5 py-3 text-sm">Free (see notes)</td></tr>
                    <tr><td className="px-5 py-3 text-sm font-medium">8–15 km</td><td className="px-5 py-3 text-sm">1.5–2 hrs</td><td className="px-5 py-3 text-sm">₹800</td><td className="px-5 py-3 text-sm">₹79 (free at ₹800+)</td></tr>
                    <tr><td className="px-5 py-3 text-sm font-medium">15–20 km</td><td className="px-5 py-3 text-sm">2–3 hrs</td><td className="px-5 py-3 text-sm">₹1,499</td><td className="px-5 py-3 text-sm">₹99 (free at ₹1,499+)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              <strong>Within 8 km:</strong> Orders under ₹99 have a ₹59 delivery charge. Orders ₹99–₹298 have a ₹40 charge. Orders ₹299+ are free.
            </p>
          </section>

          {/* Mandatory GPS */}
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold text-foreground">Why GPS Location is Required</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              When you place an order on our website or app, we ask you to share your GPS location. This is <strong>mandatory</strong> — your order cannot proceed without it.
            </p>
            <p className="text-sm text-muted leading-relaxed mb-4">
              This is necessary so we can calculate your exact distance from our hub, determine the correct delivery time, and check whether your area falls within our 20 km delivery zone.
            </p>
            <p className="text-sm text-muted leading-relaxed mb-4">
              If your phone or browser is having trouble detecting location, you can:
            </p>
            <ul className="text-sm text-muted leading-relaxed mb-4 ml-5 space-y-2 list-disc">
              <li>Check that <strong>Location Services</strong> is enabled on your phone</li>
              <li>Check that your <strong>browser has location permission</strong></li>
              <li>Enable <strong>high-accuracy GPS</strong> in your phone settings</li>
              <li>Call or WhatsApp us — we will help you place the order manually</li>
            </ul>
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5 text-sm text-blue-800">
              <p className="font-bold mb-2">Need help? Contact us:</p>
              <p className="flex items-center gap-2">WhatsApp: <a href="https://wa.me/917029908278" className="font-bold text-[#25D366] hover:underline">+91 7029908278</a></p>
              <p className="flex items-center gap-2 mt-1">Call: <a href="tel:+917029908278" className="font-bold text-foreground hover:text-[#2D7D3A]">+91 7029908278</a></p>
              <p className="flex items-center gap-2 mt-1">Call: <a href="tel:+919832966112" className="font-bold text-foreground hover:text-[#2D7D3A]">+91 9832966112</a></p>
            </div>
          </section>

          {/* How it works */}
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold text-foreground">How Delivery Works</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Browse & Add to Cart", text: "Add fresh fish, chicken, or groceries to your cart." },
                { step: 2, title: "Pin Your Location", text: "Tap 'Detect Location' on the checkout page. Your GPS is used to calculate delivery distance, time, and fees." },
                { step: 3, title: "Choose Payment", text: "Pay via UPI or Cash on Delivery. No hidden charges — what you see is what you pay." },
                { step: 4, title: "Fresh Delivery", text: "Your order is hand-packed and delivered to your door within the estimated time." },
              ].map(({ step, title, text }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#2D7D3A] text-white flex items-center justify-center text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COD */}
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold text-foreground">Cash on Delivery</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              All orders can be paid via <strong>Cash on Delivery (COD)</strong> or <strong>UPI (GPay, PhonePe, Paytm)</strong>.
              COD is our default recommended option. If your total seems low for the distance, a delivery fee may apply.
            </p>
          </section>

          {/* Same day */}
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-bold text-foreground">Delivery Hours</h2>
            <p className="text-sm text-muted leading-relaxed">
              We deliver daily from <strong>7:00 AM to 3:00 PM</strong>. Orders placed during delivery hours are delivered on a rolling basis.
              Delivery time depends on your distance from our hub at NJP Gate Bazar.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
