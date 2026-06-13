import Image from "next/image";
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
    { label: "FAQ", href: "/#faq" },
  ],
  Help: [
    { label: "FAQ", href: "/#faq" },
    { label: "Track order", href: "/account/orders" },
    { label: "Delivery info", href: "/" },
  ],
};

export function Footer() {
  return (
    <footer className="footer-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="SFM" width={48} height={48} className="h-12 w-12 object-contain" />
              <div>
                <p className="text-[16px] font-bold">Siliguri Fresh Mart</p>
                <p className="text-[12px] font-medium text-brand-fresh-dim">Fresh Mart</p>
              </div>
            </div>
            <p className="mt-5 max-w-[280px] text-[14px] leading-relaxed text-muted">
              From market to your home — in minutes, every day.
            </p>
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

        <div className="mt-12 border-t border-border/80 pt-6 text-center text-[12px] text-muted">
          © 2026 Siliguri Fresh Mart · Siliguri, West Bengal
        </div>
      </div>
    </footer>
  );
}
