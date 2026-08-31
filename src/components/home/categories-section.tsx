"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const cats = [
  { name: "Fish", href: "/fish", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_1_m5fhyp.jpg" },
  { name: "Chicken", href: "/category/chicken", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_dgzy7a.jpg" },
  { name: "Vegetables", href: "/category/vegetables", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_1_nd29bh.jpg" },
  { name: "Fruits", href: "/category/fruits", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_2_rva3oy.jpg" },
  { name: "Mutton", href: "/category/mutton", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.54_PM_2_g2jpax.jpg" },
];

const moreCats = [
  { name: "Pork", href: "/category/pork", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80" },
  { name: "Dairy & Eggs", href: "/category/dairy", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.56_PM_d2fdtk.jpg" },
];

function Tile({ cat, delay }: { cat: { name: string; href: string; img: string }; delay: number }) {
  return (
    <div className={`animate-in animate-in-d${Math.min(delay, 10)}`}>
      <Link href={cat.href} className="block">
        <div className="category-tile relative aspect-square">
          <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <div className="glass-label rounded-2xl px-2 py-2 text-center">
              <p className="text-[12px] font-bold text-white">{cat.name}</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function CategoriesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <section className="py-8 sm:py-12">
      <div className="mb-6 animate-in">
        <h2 className="section-title">Shop by category</h2>
        <p className="mt-1 text-[14px] text-muted">Hand-picked fresh, every morning.</p>
      </div>

      <div className="px-4 sm:px-0">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
          {cats.map((cat, i) => (
            <Tile key={cat.name} cat={cat} delay={i + 1} />
          ))}

          {/* "More" tile — toggles the extra categories (mobile-friendly) */}
          <div className="animate-in animate-in-d6">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="block w-full text-left"
            >
              <div className="category-tile relative aspect-square overflow-hidden rounded-2xl border border-dashed border-border bg-surface-2">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#2D7D3A]/10 to-[#F5A623]/10">
                  <span className="text-sm font-extrabold text-[#2D7D3A]">More</span>
                  <span className="text-[11px] text-muted">Categories</span>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ${showMore ? "rotate-180" : ""}`} />
                </div>
              </div>
            </button>
          </div>
        </div>

        {showMore && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {[...moreCats, { name: "All Products", href: "/search", img: "" }].map((cat, i) =>
              cat.name === "All Products" ? (
                <div key={cat.name} className="animate-in animate-in-d7">
                  <Link href={cat.href} className="block">
                    <div className="category-tile relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface-2">
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#2D7D3A]/10 to-[#F5A623]/10">
                        <span className="text-sm font-extrabold text-foreground">Shop All</span>
                        <span className="text-[11px] text-muted">See everything</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                <Tile key={cat.name} cat={cat} delay={6 + i} />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
