import Link from "next/link";
import Image from "next/image";

const links = {
  Shop: [
    { label: "Fish", href: "/fish" },
    { label: "Chicken", href: "/category/chicken" },
    { label: "Mutton", href: "/category/mutton" },
    { label: "Pork", href: "/category/pork" },
    { label: "Vegetables", href: "/category/vegetables" },
    { label: "Fruits", href: "/category/fruits" },
  ],
  Company: [
    { label: "Our Story", href: "/about" },
    { label: "Contact", href: "/account/support" },
    { label: "Track order", href: "/account/orders" },
    { label: "Delivery info", href: "/policies/shipping" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms & Conditions", href: "/policies/terms" },
    { label: "Returns & Replacement", href: "/policies/returns" },
    { label: "Shipping & Delivery", href: "/policies/shipping" },
    { label: "Cancellation", href: "/policies/cancellation" },
    { label: "Reviews & Ratings", href: "/policies/reviews" },
    { label: "Weight & Pricing", href: "/policies/weight-pricing" },
  ],
};

export function Footer() {
  return (
    <footer className="footer-surface pb-48 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image src="https://res.cloudinary.com/dz0rkctza/image/upload/v1791393836/3b2d1af4-43d0-4321-b046-17a71da08594.png" alt="SFM" width={48} height={48} className="h-12 w-12 object-contain rounded-xl" loading="lazy" />
              <div>
                <p className="text-[16px] font-bold">Siliguri Freshmart</p>
                <p className="text-[12px] font-medium text-brand-fresh-dim">Freshmart</p>
              </div>
            </div>
            <p className="mt-5 max-w-[320px] text-[14px] leading-relaxed text-muted">
              From market to your home — in minutes, every day. We deliver within 20 km of our hub at MCQF+GFQ, Siliguri.
            </p>
            <div className="mt-4 space-y-1 text-[12px] text-muted">
              <p>📍 MCQF+GFQ, Siliguri, West Bengal 734001</p>
              <p>📞 +91 7029908278 · +91 96354 80453 · +91 62959 53287</p>
              <p>📧 siligurifreshmart@gmail.com</p>
              <p>⏰ Open daily 9:00 AM – 4:00 PM</p>
            </div>
            <div className="mt-3 text-[11px] text-muted leading-relaxed">
              <p>🚚 Within 8 km: 1–2 hrs · 8–16 km: ₹79 (11 AM – 1 PM slot)</p>
              <p>🚚 16–20 km: ₹100 (2 PM – 3 PM slot)</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Hakimpara","Pradhan Nagar","Matigara","Bagdogra","Champasari","Sukna","Burdwan Road","Sevoke Road"].map((area) => (
                <span key={area} className="text-[10px] text-muted px-2 py-0.5 rounded-full border border-border/60">{area}</span>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wide">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14px] text-muted transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-border/80 pt-2 text-center text-[12px] text-muted">
          <p className="mb-1">💳 We accept: UPI · Cards · Netbanking · Cash on Delivery</p>
          © 2026 Siliguri Freshmart · MCQF+GFQ, Siliguri, West Bengal 734001
        </div>
      </div>
    </footer>
  );
}
