"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight, ChevronDown, Truck, Clock, Star, MapPin, Phone, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { FISH_SUBCAT_SEO, type FishSubcatSEO } from "@/lib/fish-subcat-seo";
import { FISH_SUBCATEGORIES } from "@/types";
import { DELIVERY_ZONES } from "@/lib/zones";
import { FAQSchema } from "@/components/seo/schemas";

const SUBCAT_IMAGES: Record<string, string> = {
  river: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412357/images_30_ptxsmz.jpg",
  sea: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782547794/624897963_18299845189302273_3065151457949707008_n_fhsj2h.jpg",
  hilsa: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782379196/Hilsa_fish_ilish_fish_bangladesh_nubluu.jpg",
  prawns: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299706/Picsart_26-06-24_11-07-31-212_ch3bu4.jpg",
  small: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412359/Boroli-Fish-North-Bengal_izgder.jpg",
  exotic: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299698/images_5_bmhxij.jpg",
  other: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782558152/IMG-20260627-WA0133_pgiyga.jpg",
};

export function FishSubcatClient({ slug }: { slug: string }) {
  const seo: FishSubcatSEO = FISH_SUBCAT_SEO[slug];
  const { data: allFish = [] } = useProductsByCategory("fish");

  const products = useMemo(
    () => allFish.filter((p) => (p.subcategory || []).includes(slug)),
    [allFish, slug]
  );

  const otherSubcats = FISH_SUBCATEGORIES.filter(
    (s) => s.value !== "unassigned" && s.value !== slug
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
        <span className="font-medium text-foreground">{seo.heroHeading.split("—")[0].trim()}</span>
      </nav>

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] shadow-xl">
        <div className="relative min-h-[260px] sm:min-h-[300px]">
          <Image
            src={SUBCAT_IMAGES[slug] || SUBCAT_IMAGES.river}
            alt={seo.heroHeading}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div>
            <span className="inline-flex rounded-full bg-white/40 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-white">
              Fresh from Siliguri
            </span>
            <h1 className="mt-3 text-[26px] sm:text-[34px] font-extrabold tracking-tight text-white leading-tight">
              {seo.heroHeading}
            </h1>
            <p className="mt-2 max-w-lg text-[14px] text-white/70 leading-relaxed">
              {seo.heroSub}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
                <Clock className="h-3.5 w-3.5" /> 45–60 min delivery
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
                <Truck className="h-3.5 w-3.5" /> Free above ₹299
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
                <Star className="h-3.5 w-3.5 fill-current" /> 4.8 rating
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Fresh & Fast</p>
              <p className="text-xs text-muted">{seo.deliveryInfo}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Sourced Locally</p>
              <p className="text-xs text-muted">From Siliguri morning markets & North Bengal rivers</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Need Help?</p>
              <p className="text-xs text-muted">Call +91 7029908278 for custom cuts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              {products.length > 0
                ? `${seo.heroHeading.split("—")[0].trim()} Available`
                : "Coming Soon"}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {products.length > 0
                ? `${products.length} items · All delivered fresh to your door`
                : "Check back soon — fresh stock arrives daily"}
            </p>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} badge="Fresh Catch" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-sm text-muted">
              No {seo.heroHeading.split("—")[0].trim().toLowerCase()} available right now.
              <br />
              <span className="font-medium text-foreground">Fresh stock arrives every morning.</span>
            </p>
            <Link
              href="/fish"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2D7D3A] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#23682E] active:scale-[0.97]"
            >
              Browse All Fish
            </Link>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-extrabold text-foreground mb-3">
          {seo.contentHeading}
        </h2>
        <p className="text-sm text-muted leading-relaxed">{seo.content}</p>
        {seo.relatedFish.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-foreground mb-2">Also try:</p>
            <div className="flex flex-wrap gap-2">
              {seo.relatedFish.map((fish) => (
                <span
                  key={fish}
                  className="rounded-full border border-[#2D7D3A]/20 bg-[#2D7D3A]/5 px-3 py-1 text-xs font-medium text-[#2D7D3A]"
                >
                  {fish}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      {seo.faq.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-extrabold text-foreground mb-4">
            Frequently Asked Questions
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
          We Deliver Across Siliguri
        </h2>
        <p className="text-xs text-muted mb-4">
          {seo.heroHeading.split("—")[0].trim()} delivered fresh to all these areas:
        </p>
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

      {/* Other subcategories */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Explore Other Fish Categories</h2>
        <div className="flex flex-wrap gap-2">
          {otherSubcats.map((sub) => (
            <Link
              key={sub.value}
              href={`/fish/${sub.value}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-[#2D7D3A]/40 hover:bg-[#2D7D3A]/5 hover:text-[#2D7D3A] active:scale-[0.97]"
            >
              {sub.label}
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
            </Link>
          ))}
        </div>
      </div>

      {/* Back to fish */}
      <Link
        href="/fish"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D7D3A] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all fish
      </Link>
    </div>
  );
}
