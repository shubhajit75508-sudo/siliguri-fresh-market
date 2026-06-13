"use client";

import { useAdminStore } from "@/store/admin-store";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { ProductSection } from "@/components/home/product-section";
import { FlashDealsSection } from "@/components/home/flash-deals";
import { FAQSection } from "@/components/home/faq-section";
import { useHydrated } from "@/lib/hooks/use-hydrated";

function SectionRenderer({ category, title, subtitle }: { category: string; title: string; subtitle: string }) {
  const { data: products = [] } = useProductsByCategory(category);

  if (!products.length) return null;

  return (
    <ProductSection
      title={title}
      subtitle={subtitle}
      products={products.slice(0, 4)}
      viewAllHref={`/category/${category}`}
    />
  );
}

export default function HomePage() {
  const { settings } = useAdminStore();
  const hydrated = useHydrated();
  const sections = settings?.sections ?? [];
  const enabledSections = hydrated ? sections.filter((s) => s.enabled) : [];

  if (!hydrated) {
    return (
      <div className="py-6 space-y-8">
        <div className="skeleton h-[460px] rounded-[32px]" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const rendered = new Set<string>();

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FlashDealsSection />

      {enabledSections.map((sec) => {
        const key = `${sec.category}-${sec.title}`;
        if (rendered.has(key)) return null;
        rendered.add(key);
        return (
          <SectionRenderer
            key={key}
            category={sec.category}
            title={sec.title}
            subtitle={sec.subtitle}
          />
        );
      })}

      <div id="faq">
        <FAQSection />
      </div>
    </>
  );
}
