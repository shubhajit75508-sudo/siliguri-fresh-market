"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { useCategories } from "@/lib/hooks/use-products";
import { useHydrated } from "@/lib/hooks/use-hydrated";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: products = [], isLoading: prodsLoading } = useProductsByCategory(slug);
  const hydrated = useHydrated();

  const category = categories.find((c) => c.slug === slug);
  if (!catsLoading && !category) notFound();

  if (!hydrated || catsLoading || prodsLoading) {
    return (
      <div className="py-6 space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-4 w-72 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-8">
        <span className="text-3xl">{category!.icon}</span>
        <h1 className="mt-2 text-2xl font-extrabold">{category!.name}</h1>
        <p className="mt-1 text-sm text-muted">{category!.description}</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted">No products found in this category.</p>
        </div>
      )}

      <button onClick={() => router.push("/")} className="mt-8 text-sm text-brand-blue hover:underline">
        ← Back to Home
      </button>
    </div>
  );
}
