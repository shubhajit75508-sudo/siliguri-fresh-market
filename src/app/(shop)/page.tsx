"use client";

import { useAdminStore } from "@/store/admin-store";
import { useProductsByCategory, useCategories } from "@/lib/hooks/use-products";
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { ProductSection } from "@/components/home/product-section";
import { FlashDealsSection } from "@/components/home/flash-deals";
import { FAQSection } from "@/components/home/faq-section";
import { TrustBar, WhyChooseUs } from "@/components/home/trust-bar";
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

const defaultNames: Record<string, string> = {
  fish: "Fresh Fish",
  chicken: "Chicken",
  mutton: "Mutton",
  seafood: "Seafood",
  vegetables: "Vegetables",
  fruits: "Fruits",
  eggs: "Eggs",
  dairy: "Dairy",
  grocery: "Grocery",
  essentials: "Daily Essentials",
};

const defaultSubs: Record<string, string> = {
  fish: "River & sea catch daily",
  chicken: "Farm-fresh poultry",
  mutton: "Premium cuts",
  seafood: "Prawns, crabs & more",
  vegetables: "Farm to table",
  fruits: "Seasonal picks",
  eggs: "Free-range & farm",
  dairy: "Milk, paneer & more",
  grocery: "Pantry staples",
  essentials: "Household must-haves",
};

export default function HomePage() {
  const { settings } = useAdminStore();
  const hydrated = useHydrated();
  const { data: allCategories = [] } = useCategories();
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
  const enabledCategories = new Set(enabledSections.map((s) => s.category));

  return (
    <>
      <HeroSection />
      <div className="mt-4 mb-6">
        <TrustBar />
      </div>
      <CategoriesSection />
      <WhyChooseUs />
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

      {allCategories.map((cat) => {
        if (enabledCategories.has(cat.slug) || rendered.has(`auto-${cat.slug}`)) return null;
        rendered.add(`auto-${cat.slug}`);
        return (
          <SectionRenderer
            key={`auto-${cat.slug}`}
            category={cat.slug}
            title={defaultNames[cat.slug] ?? cat.name}
            subtitle={defaultSubs[cat.slug] ?? cat.description}
          />
        );
      })}

      <div id="faq">
        <FAQSection />
      </div>
    </>
  );
}
