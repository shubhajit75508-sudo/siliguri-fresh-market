"use client";

import { useAdminStore } from "@/store/admin-store";
import { useProductsByCategory, useCategories } from "@/lib/hooks/use-products";
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { ProductSection } from "@/components/home/product-section";
import { FlashDealsSection } from "@/components/home/flash-deals";
import { FAQSection } from "@/components/home/faq-section";
import { TrustBar } from "@/components/home/trust-bar";
import { ReviewsSection } from "@/components/home/reviews-section";
import { FreshnessBanner, Testimonials } from "@/components/home/testimonials";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import Link from "next/link";
import { Package } from "lucide-react";

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
  pork: "Pork",
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
  pork: "Fresh pork cuts",
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
      <Link
        href="/bulk"
        className="my-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 transition-all hover:border-emerald-300 hover:shadow-md sm:px-6 sm:py-4"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-800 sm:text-base">
            Bulk Orders for Hotels, Restaurants & Events
          </p>
          <p className="text-xs text-emerald-600/80">
            Fresh fish & meat in bulk — best prices, delivered to your kitchen
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
          Order Now
        </span>
      </Link>
      <FreshnessBanner />
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

      <Testimonials />
      <ReviewsSection />
      <p className="mb-4 text-center text-[13px] text-muted leading-relaxed max-w-2xl mx-auto">
        Unlike marketplace listings or aggregator apps, Siliguri Fresh Mart sources fish, chicken and mutton directly from Siliguri&apos;s morning markets and delivers fresh to your doorstep — no middlemen, no warehouses, no frozen storage.
      </p>
      <div id="faq">
        <FAQSection />
      </div>
    </>
  );
}
