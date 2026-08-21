"use client";

import { useMemo } from "react";
import Link from "next/link";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight, ChevronDown, Truck, Clock, MapPin, Phone, ArrowLeft, Leaf } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { FISH_SPECIES_SEO, type FishSpeciesSEO } from "@/lib/fish-species-seo";
import { FISH_SUBCAT_SEO } from "@/lib/fish-subcat-seo";
import { DELIVERY_ZONES } from "@/lib/zones";
import { FAQSchema } from "@/components/seo/schemas";

export function FishSpeciesClient({ slug }: { slug: string }) {
  const seo: FishSpeciesSEO = FISH_SPECIES_SEO[slug];
  const subcatSEO = FISH_SUBCAT_SEO[seo.subcategory];
  const { data: allFish = [] } = useProductsByCategory("fish");

  const products = useMemo(
    () => allFish.filter((p) => {
      const name = p.name.toLowerCase();
      const slugName = seo.name.toLowerCase();
      const keywords = seo.keywords.map((k) => k.toLowerCase());
      return name.includes(slugName) || keywords.some((k) => name.includes(k.split(" ")[0]));
    }),
    [allFish, seo]
  );

  const otherSpecies = Object.values(FISH_SPECIES_SEO).filter(
    (s) => s.value !== slug && s.subcategory === seo.subcategory
  );

  return (
    <div className="py-6 sm:py-8">
      <FAQSchema
        questions={seo.faq.map((f) => ({ question: f.question, answer: f.answer }))}
      />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/fish" className="hover:text-foreground transition-colors">Fresh Fish</Link>
        <ChevronRight className="h-3 w-3" />
        {subcatSEO && (
          <>
            <Link href={`/fish/${seo.subcategory}`} className="hover:text-foreground transition-colors">
              {subcatSEO.heroHeading.split("—")[0].trim()}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="font-medium text-foreground">{seo.name}</span>
      </nav>

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2D7D3A] to-[#1a5c26] p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <span className="inline-flex rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-white">
            {seo.scientificName}
          </span>
          <h1 className="mt-3 text-[26px] sm:text-[34px] font-extrabold tracking-tight leading-tight">
            {seo.heroHeading}
          </h1>
          <p className="mt-2 max-w-lg text-[14px] text-white/70 leading-relaxed">
            {seo.heroSub}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
              <Clock className="h-3.5 w-3.5" /> 30-min delivery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
              <Truck className="h-3.5 w-3.5" /> Free above ₹299
            </span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              {products.length > 0
                ? `Fresh ${seo.name} Available`
                : `${seo.name} — Coming Soon`}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {products.length > 0
                ? `${products.length} items · Sourced fresh daily`
                : "Check back soon or call us at 7029908278"}
            </p>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} badge="Fresh Catch" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-sm text-muted">
              {seo.name} is currently out of stock.
              <br />
              <span className="font-medium text-foreground">Call 7029908278 to pre-order.</span>
            </p>
            <Link
              href={`/fish/${seo.subcategory}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2D7D3A] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#23682E] active:scale-[0.97]"
            >
              Browse {subcatSEO?.heroHeading.split("—")[0].trim() || "Fish"}
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-extrabold text-foreground mb-3">
          About {seo.name} Fish
        </h2>
        <p className="text-sm text-muted leading-relaxed">{seo.content}</p>

        {/* Nutrition */}
        {seo.nutrition.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-[#2D7D3A]" />
              Nutrition (per 100g)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {seo.nutrition.map((n) => (
                <div key={n.label} className="rounded-xl bg-[#2D7D3A]/5 px-3 py-2 text-center">
                  <p className="text-[11px] text-muted">{n.label}</p>
                  <p className="text-sm font-bold text-[#2D7D3A]">{n.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best for */}
        {seo.bestFor.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-bold text-foreground mb-2">Best Cooked As</h3>
            <div className="flex flex-wrap gap-2">
              {seo.bestFor.map((dish) => (
                <span
                  key={dish}
                  className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/5 px-3 py-1 text-xs font-medium text-[#B87A0A]"
                >
                  {dish}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQ */}
      {seo.faq.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-extrabold text-foreground mb-4">
            Frequently Asked Questions About {seo.name}
          </h2>
          <Accordion.Root type="single" collapsible className="space-y-2">
            {seo.faq.map((f, i) => (
              <Accordion.Item
                key={i}
                value={`faq-${i}`}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground">
                  {f.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
                <Accordion.Content className="px-5 pb-4 text-sm leading-relaxed text-muted">
                  {f.answer}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      )}

      {/* Delivery Areas */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-extrabold text-foreground mb-3">
          {seo.name} Delivered Across Siliguri
        </h2>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_ZONES.map((zone) => (
            <Link
              key={zone.slug}
              href={`/siliguri/${zone.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-[#2D7D3A]/40 hover:bg-[#2D7D3A]/5 hover:text-[#2D7D3A]"
            >
              <MapPin className="h-3 w-3" />
              {zone.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Related species */}
      {otherSpecies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3">More {subcatSEO?.heroHeading.split("—")[0].trim() || "Fish"}</h2>
          <div className="flex flex-wrap gap-2">
            {otherSpecies.map((s) => (
              <Link
                key={s.value}
                href={`/fish/species/${s.value}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-[#2D7D3A]/40 hover:bg-[#2D7D3A]/5 hover:text-[#2D7D3A] active:scale-[0.97]"
              >
                {s.name}
                <ChevronRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <Link
        href={`/fish/${seo.subcategory}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D7D3A] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {subcatSEO?.heroHeading.split("—")[0].trim() || "Fish"}
      </Link>
    </div>
  );
}
