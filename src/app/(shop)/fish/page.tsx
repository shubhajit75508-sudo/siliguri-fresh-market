"use client";

import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";

export default function FishPage() {
  const { data: fish = [] } = useProductsByCategory("fish");

  return (
    <div className="py-6 sm:py-8">
      <div className="relative mb-10 overflow-hidden rounded-[32px] shadow-xl">
        <div className="relative min-h-[280px] sm:min-h-[320px]">
          <Image unoptimized
            src="https://images.unsplash.com/photo-1544943910-04c54e739fe9?w=1400&q=85"
            alt="Fresh fish"
            fill
            className="object-cover product-img"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div className="animate-in">
            <span className="inline-flex rounded-full glass-pill px-3 py-1 text-[11px] font-semibold text-brand-fresh">
              Premium Fish Experience
            </span>
            <h1 className="mt-3 text-[28px] font-bold tracking-tight text-white sm:text-[36px]">
              Today&apos;s Fresh Catch
            </h1>
            <p className="mt-2 max-w-md text-[14px] text-white/65">
              River & sea fish from Teesta and Mahananda — choose your cut, cleaned to order.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {fish.map((p, i) => (
          <div key={p.id} className={`animate-in animate-in-d${Math.min(i + 1, 10)}`}>
            <ProductCard product={p} badge="Fresh Catch" />
          </div>
        ))}
      </div>
    </div>
  );
}
