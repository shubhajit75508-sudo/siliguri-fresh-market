"use client";

import Image from "next/image";
import Link from "next/link";

const cats = [
  { name: "Fish", href: "/fish", img: "https://images.unsplash.com/photo-1544943910-04c54e739fe9?w=700&q=85" },
  { name: "Chicken", href: "/category/chicken", img: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=700&q=85" },
  { name: "Mutton", href: "/category/mutton", img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=700&q=85" },
  { name: "Vegetables", href: "/category/vegetables", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&q=85" },
  { name: "Fruits", href: "/category/fruits", img: "https://images.unsplash.com/photo-1619566636852-adf3ef00000b?w=700&q=85" },
  { name: "Dairy & Eggs", href: "/category/dairy", img: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=700&q=85" },
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
                  <Image src={cat.img} alt={cat.name} fill className="object-cover" sizes="200px" />
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
