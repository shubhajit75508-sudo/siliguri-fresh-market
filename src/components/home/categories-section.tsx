"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Package } from "lucide-react";

const cats = [
  { name: "Fish", href: "/fish", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_1_m5fhyp.jpg" },
  { name: "Chicken", href: "/category/chicken", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_dgzy7a.jpg" },
  { name: "Mutton", href: "/category/mutton", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.54_PM_2_g2jpax.jpg" },
  { name: "Vegetables", href: "/category/vegetables", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_1_nd29bh.jpg" },
  { name: "Fruits", href: "/category/fruits", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_2_rva3oy.jpg" },
];

const moreCats = [
  { name: "Pork", href: "/category/pork", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80" },
  { name: "Dairy & Eggs", href: "/category/dairy", img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.56_PM_d2fdtk.jpg" },
];

function RailTile({ cat, delay }: { cat: { name: string; href: string; img: string }; delay: number }) {
  return (
    <div className={`shrink-0 animate-in animate-in-d${Math.min(delay, 10)}`}>
      <Link href={cat.href} className="flex w-[72px] flex-col items-center gap-1.5">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#E3EFE6] bg-white shadow-sm transition-transform group-hover:scale-105 hover:scale-105">
          <Image src={cat.img} alt={cat.name} fill sizes="56px" className="object-cover" loading="lazy" />
        </div>
        <span className="w-full truncate text-center text-[11px] font-semibold text-foreground">{cat.name}</span>
      </Link>
    </div>
  );
}

export function CategoriesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <section className="-mx-4 mb-1 bg-gradient-to-b from-[#EBF4ED] to-transparent px-4 pb-2 pt-3 sm:mx-0 sm:bg-none sm:px-0 sm:pb-3 sm:pt-4">
      <div className="mb-3 flex items-end justify-between gap-4 animate-in">
        <div className="flex items-center gap-2.5">
          <span className="section-header-accent h-6" />
          <div>
            <h2 className="text-[17px] sm:text-[22px] font-extrabold tracking-tight text-foreground leading-tight">Shop by category</h2>
            <p className="mt-0.5 text-[12px] text-muted">Hand-picked fresh, every morning.</p>
          </div>
        </div>
        <Link href="/search" className="view-all-pill shrink-0">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-2 sm:gap-4">
        {cats.map((cat, i) => (
          <RailTile key={cat.name} cat={cat} delay={i + 1} />
        ))}

        {showMore && (
          <>
            {moreCats.map((cat, i) => (
              <RailTile key={cat.name} cat={cat} delay={6 + i} />
            ))}

            <div className="animate-in animate-in-d8 shrink-0 sm:shrink">
              <Link href="/search" className="flex w-[72px] flex-col items-center gap-1.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2D7D3A]/12 to-[#F5A623]/12 border border-[#D3E8D8]">
                  <Package className="h-5 w-5 text-[#23682E]" />
                </div>
                <span className="w-full text-center text-[11px] font-semibold text-[#23682E]">Shop All</span>
              </Link>
            </div>
          </>
        )}

        {/* "More" chip — last position; toggles the extra categories (mobile-friendly) */}
        <button onClick={() => setShowMore((v) => !v)} className="animate-in animate-in-d6 shrink-0 sm:shrink">
          <div className="flex w-[72px] flex-col items-center gap-1.5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border border-dashed transition-colors ${
                showMore ? "border-[#2D7D3A] bg-[#2D7D3A]/10" : "border-[#BFDFC4] bg-[#F2FAF2]"
              }`}
            >
              <span className="text-[10px] font-extrabold text-[#23682E]">More</span>
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted">
              Categories
              <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}