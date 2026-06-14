"use client";

import Link from "next/link";
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
    <section className="py-8 sm:py-12">
      <div className="mb-6 flex animate-in items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 px-2 py-2 text-[13px] font-semibold text-brand-fresh-dim hover:underline"
          >
            See all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            className={`animate-in animate-in-d${Math.min(i + 1, 10)}`}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
