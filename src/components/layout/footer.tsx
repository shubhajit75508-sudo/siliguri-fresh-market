import Link from "next/link";

const links = {
  Shop: [
    { label: "Fish", href: "/fish" },
    { label: "Chicken", href: "/category/chicken" },
    { label: "Mutton", href: "/category/mutton" },
    { label: "Vegetables", href: "/category/vegetables" },
    { label: "Fruits", href: "/category/fruits" },
  ],
  Company: [
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
  ],
};

export function Footer() {
  return (
    <footer className="footer-surface pb-48 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img src="https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg" alt="SFM" width={48} height={48} className="h-12 w-12 object-contain rounded-xl" />
              <div>
                <p className="text-[16px] font-bold">Siliguri Fresh Mart</p>
                <p className="text-[12px] font-medium text-brand-fresh-dim">Fresh Mart</p>
              </div>
            </div>
            <p className="mt-5 max-w-[280px] text-[14px] leading-relaxed text-muted">
              From market to your home — in minutes, every day.
            </p>
            <div className="mt-4 space-y-1 text-[12px] text-muted">
              <p>📍 Siliguri, West Bengal 734001</p>
              <p>📞 +91 98765 43210</p>
              <p>📧 hello@siligurifreshmart.com</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Hakimpara","Pradhan Nagar","Matigara","Bagdogra","Siliguri Town","Champasari","Sukna","Burdwan Road"].map((area) => (
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
          © 2026 Siliguri Fresh Mart · Siliguri, West Bengal
        </div>
      </div>
    </footer>
  );
}