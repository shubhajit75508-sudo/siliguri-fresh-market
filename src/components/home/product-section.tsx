"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
}

export function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
}: ProductSectionProps) {
  if (!products.length) return null;

  return (
    <section className="py-3 sm:py-5">
      <div className="storefront-panel p-3 sm:p-5">
        <div className="mb-3 flex animate-in items-end justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="section-header-accent h-7" />
            <div className="min-w-0">
              <h2 className="truncate text-[17px] sm:text-[22px] font-extrabold tracking-tight text-foreground leading-tight">{title}</h2>
              {subtitle && <p className="mt-0.5 truncate text-[12px] text-muted">{subtitle}</p>}
            </div>
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="view-all-pill shrink-0">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              className={`animate-in animate-in-d${Math.min(i + 1, 10)}`}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}