"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shuffle, ChevronRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { useProducts } from "@/lib/hooks/use-products";

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function RandomPicksSection() {
  const { data: allProducts = [] } = useProducts();
  const [seed, setSeed] = useState(0);

  const picks = useMemo(() => {
    const available = allProducts.filter((p) => p.inStock);
    const list = [...available];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i * 31 + 7) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, 9);
  }, [allProducts, seed]);

  if (!picks.length) return null;

  return (
    <section className="pt-3 pb-1 sm:pt-6">
      <div className="mb-3.5 flex items-end justify-between gap-4 animate-in">
        <div className="flex items-center gap-2.5">
          <span className="section-header-accent h-6" />
          <h2 className="flex items-center gap-1.5 text-[17px] sm:text-[22px] font-extrabold tracking-tight text-foreground leading-tight">
            <Sparkles className="h-4 w-4 text-[#2D7D3A]" /> Just for You
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setSeed((s) => s + 1)}
            aria-label="Shuffle products"
            title="Shuffle"
            className="view-all-pill"
          >
            <Shuffle className="h-3.5 w-3.5" /> Shuffle
          </button>
          <Link href="/search" className="view-all-pill">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1 pb-2 snap-x snap-mandatory scroll-smooth sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-1 sm:gap-4 xl:grid-cols-4">
        {picks.slice(0, 8).map((p) => (
          <div key={p.id} className="w-[172px] shrink-0 snap-start sm:w-auto sm:shrink">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}