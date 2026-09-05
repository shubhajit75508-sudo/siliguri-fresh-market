"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Star, ShieldCheck, Package, ArrowRight, User, ChevronLeft, ChevronRight, Shuffle, Sparkles } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

const trustStats = [
  { icon: Package, value: "5K+", label: "Orders", accent: "text-white" },
  { icon: Star, value: "4.8", label: "Rating", accent: "text-[#FFD98A]" },
  { icon: Clock, value: "45m", label: "Delivery", accent: "text-[#A5E0A8]" },
  { icon: ShieldCheck, value: "100%", label: "Secure", accent: "text-white" },
];

type BannerSlide = {
  kind: "banner";
  id: string;
  pill: React.ReactNode;
  title: string;
  sub: string;
  cta: string;
  href: string;
  secondary?: { label: string; href: string };
  img: string;
  alt: string;
};

type ProductSlide = {
  kind: "product";
  id: string;
  product: Product;
};

type Slide = BannerSlide | ProductSlide;

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const livePill = (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/25 backdrop-blur-sm sm:px-3.5 sm:py-1.5">
    <span className="live-dot relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A5E0A8] opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A5E0A8] shadow-[0_0_8px_#A5E0A8]" />
    </span>
    <span className="text-[10px] font-bold tracking-wide text-white sm:text-[12px]">Live · Delivering in 45–60 min</span>
  </span>
);

const catPill = (label: string) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/25 backdrop-blur-sm sm:px-3.5 sm:py-1.5">
    <span className="inline-flex h-2 w-2 rounded-full bg-[#FFD98A] shadow-[0_0_8px_#FFD98A]" />
    <span className="text-[10px] font-bold tracking-wide text-white sm:text-[12px]">{label}</span>
  </span>
);

export function HeroSection() {
  const { settings } = useAdminStore();
  const raw = settings?.hero;
  const hero = {
    image: raw?.image || "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782317544/file_0000000086c471fd894712adc4d3fa68_vadejf.png",
    title: raw?.title || "Fresh Fish, Chicken,\ndelivered fresh to your door.",
    subtitle: raw?.subtitle || "From the morning market to your kitchen.",
  };

  const { data: allProducts = [] } = useProducts();
  const [seed, setSeed] = useState(0);

  const picks = useMemo(() => {
    const list = allProducts.filter((p) => p.inStock);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i * 31 + 7) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, 6);
  }, [allProducts, seed]);

  const slides: Slide[] = useMemo(() => {
    const banners: BannerSlide[] = [
      {
        kind: "banner",
        id: "hero",
        pill: livePill,
        title: hero.title,
        sub: hero.subtitle,
        cta: "Shop fresh now",
        href: "/search",
        secondary: { label: "My Account", href: "/account" },
        img: hero.image,
        alt: "Siliguri Fresh Mart — fresh fish, chicken, mutton & vegetables delivery in Siliguri",
      },
      {
        kind: "banner",
        id: "fish",
        pill: catPill("Fresh Catch"),
        title: "Fresh Fish,\ncaught & delivered fresh today.",
        sub: "River & sea catch, from Siliguri's morning markets.",
        cta: "Shop Fish",
        href: "/fish",
        img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_1_m5fhyp.jpg",
        alt: "Fresh fish from Siliguri Fresh Mart",
      },
      {
        kind: "banner",
        id: "chicken",
        pill: catPill("Farm Fresh"),
        title: "Farm-fresh chicken,\ndelivered cut & clean.",
        sub: "Cut fresh to order, portioned just for you.",
        cta: "Shop Chicken",
        href: "/category/chicken",
        img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_dgzy7a.jpg",
        alt: "Farm fresh chicken from Siliguri Fresh Mart",
      },
      {
        kind: "banner",
        id: "mutton",
        pill: catPill("Premium Cuts"),
        title: "Premium mutton,\ntender, juicy cuts.",
        sub: "Slow-aged, tender cuts for the perfect curry.",
        cta: "Shop Mutton",
        href: "/category/mutton",
        img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.54_PM_2_g2jpax.jpg",
        alt: "Premium mutton from Siliguri Fresh Mart",
      },
      {
        kind: "banner",
        id: "vegetables",
        pill: catPill("Farm to Table"),
        title: "Farm-fresh vegetables,\nat your door in minutes.",
        sub: "Straight from the farm to your kitchen.",
        cta: "Shop Vegetables",
        href: "/category/vegetables",
        img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_1_nd29bh.jpg",
        alt: "Farm fresh vegetables from Siliguri Fresh Mart",
      },
      {
        kind: "banner",
        id: "fruits",
        pill: catPill("Seasonal Picks"),
        title: "Seasonal fruits,\npicked at peak ripeness.",
        sub: "Sweet, ripe and full of flavour.",
        cta: "Shop Fruits",
        href: "/category/fruits",
        img: "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216120/WhatsApp_Image_2026-06-23_at_5.21.55_PM_2_rva3oy.jpg",
        alt: "Seasonal fruits from Siliguri Fresh Mart",
      },
      {
        kind: "banner",
        id: "view-all",
        pill: catPill("Always Fresh"),
        title: "Craving something else?",
        sub: "Browse the full store for every fresh pick — fish, meat, produce & more.",
        cta: "View All Products",
        href: "/search",
        img: hero.image,
        alt: "Browse all products at Siliguri Fresh Mart",
      },
    ];

    const productSlides: ProductSlide[] = picks.map((p, i) => ({
      kind: "product",
      id: `jfy-${i}`,
      product: p,
    }));

    return [...banners, ...productSlides];
  }, [hero.title, hero.subtitle, hero.image, picks]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, paused, slides.length]);

  const slide = slides[index];

  return (
    <section className="pt-2 pb-0 sm:pt-4">
      <div
        className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#18521E] via-[#2D7D3A] to-[#3E9B4E] shadow-[0_12px_32px_rgba(27,94,32,0.28)] sm:rounded-[30px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="absolute inset-0">
          <Image
            src={hero.image}
            alt="Siliguri Fresh Mart — fresh fish, chicken, mutton & vegetables delivery in Siliguri"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#173F1D]/85 via-[#1B5E20]/55 to-[#2D7D3A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2E0E]/90 via-transparent to-transparent" />
        </div>

        {/* soft glow accents */}
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="relative px-4 pb-3 pt-4 sm:px-7 sm:pb-5 sm:pt-6 lg:px-8">
          {/* carousel */}
          <div className="relative">
            <div className="relative min-h-[258px] sm:min-h-[278px] lg:min-h-[292px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {slide.kind === "product" ? (
                    <div className="flex flex-col items-center py-1.5 sm:py-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/25 backdrop-blur-sm sm:px-3.5 sm:py-1.5">
                        <Sparkles className="h-3 w-3 text-[#FFD98A]" />
                        <span className="text-[10px] font-bold tracking-wide text-white sm:text-[12px]">Just for You</span>
                      </span>
                      <div className="mt-3 w-[224px] shrink-0 sm:w-[250px]">
                        <ProductCard product={slide.product} />
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const lines = slide.title.split("\n");
                      return (
                        <div className="flex items-center gap-6">
                          <div className="min-w-0 flex-1">
                            {slide.pill}

                            <h1 className="mt-2.5 text-[23px] font-extrabold leading-[1.3] tracking-[-0.03em] text-white drop-shadow-md min-[380px]:text-[26px] sm:text-[34px] lg:text-[42px]">
                              {lines.map((line, i) => (
                                <span key={i} className="block">
                                  {i === 0 ? (
                                    line
                                  ) : (
                                    <span className="bg-gradient-to-r from-[#FFD98A] via-[#F8C762] to-[#FFB84D] bg-clip-text text-transparent">
                                      {line}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </h1>

                            <p className="mt-1.5 max-w-[420px] text-[13px] leading-relaxed text-white/85 sm:mt-2 sm:text-[15px]">
                              {slide.sub}
                            </p>

                            <div className="mt-3.5 flex gap-2 sm:mt-5">
                              <Link
                                href={slide.href}
                                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#F8C762] to-[#F5A623] px-4 text-[13px] font-extrabold text-[#1E3A14] shadow-lg shadow-[#F5A623]/30 ring-1 ring-[#E8960A]/40 transition-all hover:brightness-105 active:scale-[0.97] sm:h-12 sm:flex-none sm:px-6 sm:text-[14px]"
                              >
                                {slide.cta} <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                              </Link>
                              {slide.secondary && (
                                <Link
                                  href={slide.secondary.href}
                                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 text-[12px] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97] sm:h-12 sm:px-6 sm:text-[14px]"
                                >
                                  <User className="h-4 w-4" strokeWidth={2.5} />
                                  {slide.secondary.label}
                                </Link>
                              )}
                            </div>
                          </div>

                          <div className="hidden shrink-0 md:block">
                            <div className="relative h-36 w-36 overflow-hidden rounded-[26px] ring-4 ring-white/20 shadow-xl lg:h-44 lg:w-44">
                              <Image src={slide.img} alt={slide.alt} fill sizes="176px" className="object-cover" />
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* arrows + shuffle */}
            {slides.length > 1 && (
              <div className="absolute right-0 top-0 z-10 flex gap-1.5">
                {picks.length > 0 && (
                  <button
                    onClick={() => setSeed((s) => s + 1)}
                    aria-label="Shuffle just for you products"
                    title="Shuffle"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    <Shuffle className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* dots */}
          {slides.length > 1 && (
            <div className="mt-3 flex justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1} of ${slides.length}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-5 bg-[#FFD98A] shadow-[0_0_6px_#FFD98A]"
                      : "w-1.5 bg-white/35 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}

          {/* integrated trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-2 py-2.5 backdrop-blur-md sm:px-4 sm:py-3"
          >
            <div className="flex items-center">
              {trustStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Fragment key={stat.label}>
                    <div className="flex flex-1 flex-col items-center gap-0.5">
                      <Icon className={`h-4 w-4 ${stat.accent}`} strokeWidth={2.2} />
                      <span className="text-[13px] font-extrabold leading-tight text-white sm:text-base">
                        {stat.value}
                      </span>
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-white/55 sm:text-[9.5px]">
                        {stat.label}
                      </span>
                    </div>
                    {i < trustStats.length - 1 && <span className="h-9 w-px bg-white/15" />}
                  </Fragment>
                );
              })}
            </div>
            <p className="mt-2 border-t border-white/10 pt-1.5 text-center text-[9.5px] font-semibold text-white/70 sm:mt-2.5 sm:text-[11px]">
              Free delivery above ₹299 · Sourced from this morning&apos;s market
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}