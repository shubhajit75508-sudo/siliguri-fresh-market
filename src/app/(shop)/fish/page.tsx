"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import { ProductFilterBar, type ProductFiltersState } from "@/components/product/product-filter-bar";
import { FISH_SUBCATEGORIES } from "@/types";
import { cn } from "@/lib/utils";
import { Waves, Fish, Anchor, Shell, Sparkles, Grid3X3, ChevronRight } from "lucide-react";

const SUBCAT_ICONS: Record<string, React.ReactNode> = {
  all: <Grid3X3 className="h-5 w-5" />,
  river: <Waves className="h-5 w-5" />,
  sea: <Anchor className="h-5 w-5" />,
  hilsa: <Fish className="h-5 w-5" />,
  prawns: <Shell className="h-5 w-5" />,
  small: <Fish className="h-4 w-4" />,
  exotic: <Sparkles className="h-5 w-5" />,
  other: <Fish className="h-5 w-5" />,
};

const SUBCAT_IMAGES: Record<string, string> = {
  river: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412357/images_30_ptxsmz.jpg",
  sea: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782547794/624897963_18299845189302273_3065151457949707008_n_fhsj2h.jpg",
  hilsa: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782379196/Hilsa_fish_ilish_fish_bangladesh_nubluu.jpg",
  prawns: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299706/Picsart_26-06-24_11-07-31-212_ch3bu4.jpg",
  small: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412359/Boroli-Fish-North-Bengal_izgder.jpg",
  exotic: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782299698/images_5_bmhxij.jpg",
  other: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782558152/IMG-20260627-WA0133_pgiyga.jpg",
};

export default function FishPage() {
  const { data: fish = [] } = useProductsByCategory("fish");
  const [filters, setFilters] = useState<ProductFiltersState>({ sort: "name", inStockOnly: false });
  const [subcat, setSubcat] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [fish.length]);

  const processed = useMemo(() => {
    let list = [...fish];
    if (subcat !== "all") {
      list = list.filter((p) => (p.subcategory || []).includes(subcat));
    }
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);
    switch (filters.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "rating": list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return list;
  }, [fish, filters, subcat]);

  const chipOptions = [
    { value: "all", label: "All" },
    ...FISH_SUBCATEGORIES.filter((s) => s.value !== "unassigned"),
  ];

  return (
    <div className="py-6 sm:py-8">
      <style>{`
        @keyframes subcard-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.92); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes badge-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(45,125,58,0.25); }
          50% { box-shadow: 0 0 16px 4px rgba(45,125,58,0.45); }
        }
        @keyframes hero-zoom {
          0% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .subcard-enter { animation: subcard-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .badge-pop { animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
        .glow-active { animation: glow-pulse 2s ease-in-out infinite; }
        .hero-zoom { animation: hero-zoom 0.8s ease-out both; }
        .subcard-active-img { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .group:hover .subcard-active-img { transform: scale(1.12); }
      `}</style>

      {/* Hero Banner */}
      <div className="relative mb-10 overflow-hidden rounded-[32px] shadow-xl">
        <div className="relative min-h-[280px] sm:min-h-[320px]">
          <Image
            src="https://res.cloudinary.com/dc5fh5afb/image/upload/v1782412357/images_30_ptxsmz.jpg"
            alt="Fresh fish"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 100vw"
            style={{ objectFit: "cover" }}
            className="hero-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
          <div className="animate-in">
            <span className="inline-flex rounded-full bg-white/40 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-[#2D7D3A]">
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

      {/* Subcategory Filter Cards */}
      <div className="relative mb-6 -mx-4 px-4">
        <div ref={scrollRef} className="overflow-x-auto scrollbar-none">
          <div className="flex gap-3 min-w-max pb-2">
          {/* All Card */}
          <button
            onClick={() => setSubcat("all")}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3 min-h-[44px] min-w-[88px] shrink-0 active:scale-95 transition-transform duration-150",
              mounted ? "subcard-enter" : "opacity-0",
              subcat === "all"
                ? "border-[#2D7D3A] bg-[#2D7D3A]/10 shadow-lg shadow-[#2D7D3A]/15 glow-active"
                : "border-border bg-surface hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5 hover:scale-105 hover:shadow-md"
            )}
            style={{ animationDelay: "0ms" }}
          >
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300",
              subcat === "all"
                ? "bg-[#2D7D3A] text-white shadow-md shadow-[#2D7D3A]/30"
                : "bg-[#2D7D3A]/10 text-[#2D7D3A] group-hover:bg-[#2D7D3A]/15 group-hover:scale-110 group-hover:rotate-3"
            )}>
              {SUBCAT_ICONS.all}
            </div>
            <span className={cn(
              "text-[11px] font-bold whitespace-nowrap transition-colors duration-200",
              subcat === "all" ? "text-[#2D7D3A]" : "text-muted group-hover:text-foreground"
            )}>
              All
            </span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none badge-pop",
              subcat === "all" ? "bg-[#2D7D3A] text-white" : "bg-muted/10 text-muted"
            )} style={{ animationDelay: "200ms" }}>
              {fish.length}
            </span>
          </button>

          {/* Category Cards */}
          {FISH_SUBCATEGORIES.filter((s) => s.value !== "unassigned").map((sub, i) => {
            const count = fish.filter((p) => (p.subcategory || []).includes(sub.value)).length;
            const img = SUBCAT_IMAGES[sub.value];
            const delay = (i + 1) * 70;
            return (
              <button
                key={sub.value}
                onClick={() => setSubcat(sub.value)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3 min-h-[44px] min-w-[88px] shrink-0 active:scale-95 transition-transform duration-150",
                  mounted ? "subcard-enter" : "opacity-0",
                  subcat === sub.value
                    ? "border-[#2D7D3A] bg-[#2D7D3A]/10 shadow-lg shadow-[#2D7D3A]/15 glow-active"
                    : "border-border bg-surface hover:border-[#2D7D3A]/30 hover:bg-[#2D7D3A]/5 hover:scale-105 hover:shadow-md"
                )}
                style={{ animationDelay: `${delay}ms` }}
              >
                {img ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl shadow-sm">
                    <Image
                      src={img}
                      alt={sub.label}
                      fill
                      sizes="56px"
                      style={{ objectFit: "cover" }}
                      className={cn(
                        "subcat-active-img transition-all duration-300",
                        subcat === sub.value ? "brightness-110 saturate-110" : "group-hover:brightness-105"
                      )}
                    />
                    <div className={cn(
                      "absolute inset-0 rounded-xl transition-all duration-300",
                      subcat === sub.value ? "ring-2 ring-[#2D7D3A] ring-offset-1" : ""
                    )} />
                  </div>
                ) : (
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300",
                    subcat === sub.value
                      ? "bg-[#2D7D3A] text-white shadow-md shadow-[#2D7D3A]/30"
                      : "bg-[#2D7D3A]/10 text-[#2D7D3A] group-hover:bg-[#2D7D3A]/15 group-hover:scale-110 group-hover:rotate-3"
                  )}>
                    {SUBCAT_ICONS[sub.value] ?? <Fish className="h-5 w-5" />}
                  </div>
                )}
                <span className={cn(
                  "text-[11px] font-bold whitespace-nowrap transition-colors duration-200",
                  subcat === sub.value ? "text-[#2D7D3A]" : "text-muted group-hover:text-foreground"
                )}>
                  {sub.label}
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none badge-pop",
                  subcat === sub.value ? "bg-[#2D7D3A] text-white" : "bg-muted/10 text-muted"
                )} style={{ animationDelay: `${delay + 150}ms` }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        </div>
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center pr-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md shadow-black/10 backdrop-blur-sm border border-border/50">
              <ChevronRight className="h-5 w-5 text-[#2D7D3A] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Popular Fish Species Links */}
      <div className="mb-6">
        <h2 className="text-sm font-extrabold text-foreground mb-3">Popular Fish</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Rohu", href: "/fish/species/rohu" },
            { label: "Katla", href: "/fish/species/katla" },
            { label: "Hilsa (Ilish)", href: "/fish/species/hilsa" },
            { label: "Bhetki", href: "/fish/species/bhetki" },
            { label: "Pomfret", href: "/fish/species/pomfret" },
            { label: "Tiger Prawns", href: "/fish/species/prawns" },
            { label: "Norwegian Salmon", href: "/fish/species/salmon" },
            { label: "Pabda", href: "/fish/species/pabda" },
          ].map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="inline-flex items-center gap-1 rounded-full border border-[#2D7D3A]/20 bg-[#2D7D3A]/5 px-3 py-1.5 text-xs font-semibold text-[#2D7D3A] transition-all hover:bg-[#2D7D3A]/10 hover:shadow-sm active:scale-[0.97]"
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Sort + Filter Bar */}
      <ProductFilterBar
        total={fish.length}
        filtered={processed.length}
        filters={filters}
        onChange={setFilters}
      />

      {/* Product Grid */}
      {processed.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {processed.map((p, i) => (
            <div key={p.id} className={`animate-in animate-in-d${Math.min(i + 1, 10)}`}>
              <ProductCard product={p} badge="Fresh Catch" />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted">
            {subcat !== "all"
              ? `No products tagged as "${FISH_SUBCATEGORIES.find((s) => s.value === subcat)?.label ?? subcat}" yet. Check back soon!`
              : "No products match your filters."}
          </p>
        </div>
      )}
    </div>
  );
}
