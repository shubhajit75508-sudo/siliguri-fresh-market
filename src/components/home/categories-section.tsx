"use client";

import Link from "next/link";

const cats = [
  { name: "Fish", href: "/fish", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_1_m5fhyp.jpg" },
  { name: "Chicken", href: "/category/chicken", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_dgzy7a.jpg" },
  { name: "Mutton", href: "/category/mutton", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.54_PM_2_g2jpax.jpg" },
  { name: "Vegetables", href: "/category/vegetables", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_1_nd29bh.jpg" },
  { name: "Fruits", href: "/category/fruits", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_2_rva3oy.jpg" },
  { name: "Dairy & Eggs", href: "/category/dairy", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.56_PM_d2fdtk.jpg" },
];

export function CategoriesSection() {
  return (
    <section className="py-8 sm:py-12">
      <div className="mb-6 animate-in">
        <h2 className="section-title">Shop by category</h2>
        <p className="mt-1 text-[14px] text-muted">Hand-picked fresh, every morning.</p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:grid sm:grid-cols-3 md:grid-cols-6 sm:gap-4 snap-x snap-mandatory scroll-smooth">
          {cats.map((cat, i) => (
            <div
              key={cat.name}
              className={`w-[130px] shrink-0 sm:w-auto animate-in animate-in-d${Math.min(i + 1, 10)} snap-start`}
            >
              <Link href={cat.href} className="block">
                <div className="category-tile relative aspect-square">
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="glass-label rounded-2xl px-3 py-2.5">
                      <p className="text-[14px] font-bold text-white">{cat.name}</p>
                      <p className="text-[11px] text-white/55">Fresh today</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}