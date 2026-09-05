"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Package } from "lucide-react";

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

function RailTile({ cat }: { cat: { name: string; href: string; img: string } }) {
  return (
    <div className="shrink-0">
      <Link href={cat.href} className="flex w-[84px] flex-col items-center gap-2 sm:w-[104px]">
        <div className="relative h-[68px] w-[68px] overflow-hidden rounded-2xl border border-[#E3EFE6] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#2D7D3A]/40 hover:shadow-md sm:h-[80px] sm:w-[80px]">
          <Image src={cat.img} alt={cat.name} fill sizes="80px" className="object-cover" loading="lazy" />
        </div>
        <span className="w-full truncate text-center text-[12.5px] font-semibold text-foreground sm:text-[13px]">{cat.name}</span>
      </Link>
    </div>
  );
}

export function CategoriesSection() {
  const [showMore, setShowMore] = useState(false);

  return (
    <section className="pb-1 pt-4 sm:pb-2 sm:pt-6">
      <div className="mb-3.5 flex items-end justify-between gap-4 animate-in">
        <div className="flex items-center gap-2.5">
          <span className="section-header-accent h-6" />
          <h2 className="text-[17px] sm:text-[22px] font-extrabold tracking-tight text-foreground leading-tight">
            Shop by category
          </h2>
        </div>
        <Link href="/search" className="view-all-pill shrink-0">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-2 sm:gap-4">
        {cats.map((cat) => (
          <RailTile key={cat.name} cat={cat} />
        ))}

        <button onClick={() => setShowMore((v) => !v)} className="shrink-0 sm:shrink">
          <div className="flex w-[84px] flex-col items-center gap-2 sm:w-[104px]">
            <div
              className={`flex h-[68px] w-[68px] items-center justify-center rounded-2xl border transition-colors sm:h-[80px] sm:w-[80px] ${
                showMore ? "border-[#2D7D3A] bg-[#2D7D3A]/10" : "border-[#DCEBE0] bg-[#F4FAF5]"
              }`}
            >
              <span className="text-[12px] font-extrabold text-[#23682E]">More</span>
            </div>
            <span className="flex items-center gap-0.5 text-[12px] font-medium text-muted">
              Categories
              <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
            </span>
          </div>
        </button>

        {showMore && (
          <>
            {moreCats.map((cat) => (
              <RailTile key={cat.name} cat={cat} />
            ))}

            <div className="shrink-0 sm:shrink">
              <Link href="/search" className="flex w-[84px] flex-col items-center gap-2 sm:w-[104px]">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-[#DCEBE0] bg-[#F4FAF5] sm:h-[80px] sm:w-[80px]">
                  <Package className="h-5 w-5 text-[#23682E]" />
                </div>
                <span className="w-full text-center text-[12.5px] font-semibold text-[#23682E]">Shop All</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}