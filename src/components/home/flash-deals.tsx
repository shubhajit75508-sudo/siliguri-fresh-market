"use client";

import { Zap } from "lucide-react";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { ProductCard } from "@/components/product/product-card";
import { useFlashDeals } from "@/lib/hooks/use-products";

export function FlashDealsSection() {
  const { data: deals = [], isLoading, error } = useFlashDeals();

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 via-brand-orange/5 to-brand-red/5" />
      <div className="relative mx-auto max-w-7xl px-4">
        <FadeIn className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
            <Zap className="h-5 w-5 text-brand-red" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Flash Deals</h2>
            <p className="text-sm text-muted">
              {isLoading ? "Loading..." : error ? "Error loading deals" : `${deals.length} deals available`}
            </p>
          </div>
        </FadeIn>
        {deals.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} badge="Flash Deal" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}