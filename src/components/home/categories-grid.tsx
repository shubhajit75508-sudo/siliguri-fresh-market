"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Package } from "lucide-react";
import { useCategories } from "@/lib/hooks/use-products";

export function CategoriesGrid() {
  const { data: categories = [] } = useCategories();

  if (!categories.length) return null;

  const tiles = categories.slice(0, 9);

  return (
    <section className="pt-3 pb-1 sm:pt-4">
      <div className="mb-3.5 flex items-end justify-between gap-4 animate-in">
        <div className="flex items-center gap-2.5">
          <span className="section-header-accent h-6" />
          <div>
            <h2 className="text-[17px] sm:text-[22px] font-extrabold tracking-tight text-foreground leading-tight">
              Shop by category
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">Hand-picked fresh, every morning.</p>
          </div>
        </div>
        <Link href="/search" className="view-all-pill shrink-0">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5 lg:grid-cols-5">
        {tiles.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-[#E7EFE9] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:rounded-3xl"
          >
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 30vw, 18vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2D7D3A] to-[#3E9B4E]">
                <Package className="h-8 w-8 text-white/85" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
            <span className="absolute inset-x-2.5 bottom-2 truncate text-left text-[12px] font-extrabold text-white drop-shadow sm:bottom-2.5 sm:text-sm">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}