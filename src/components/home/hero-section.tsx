"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";

const trustPoints = [
  { text: "4.8 rated" },
  { text: "Free delivery above ₹299" },
  { text: "Delivered in 45–60 min" },
];

export function HeroSection() {
  const { settings } = useAdminStore();
  const raw = settings?.hero;
  const hero = {
    image: raw?.image || "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782317544/file_0000000086c471fd894712adc4d3fa68_vadejf.png",
    title: raw?.title || "Fresh Fish, Chicken,\ndelivered fresh to your door.",
    subtitle: raw?.subtitle || "From the morning market to your kitchen, every single day.",
  };

  const lines = hero.title.split("\n");

  return (
    <section className="pt-1 sm:pt-4">
      <div className="relative overflow-hidden rounded-[22px] border border-[#E1EFE4] bg-gradient-to-br from-[#F1FAF2] via-white to-[#EAF5EC] sm:rounded-[30px]">
        {/* soft light accents */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#2D7D3A]/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#A5D6A7]/20 blur-3xl" />

        <div className="relative flex items-center gap-8 p-5 sm:p-8 lg:p-10">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#CDE6D2] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#23682E]">
              <span className="live-dot relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2D7D3A] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2D7D3A]" />
              </span>
              Live · Delivering across Siliguri today
            </span>

            <h1 className="mt-3 text-[26px] font-extrabold leading-[1.2] tracking-tight text-[#173F1D] min-[380px]:text-[30px] min-[420px]:text-[33px] sm:text-[38px] lg:text-[44px]">
              {lines.map((line, i) => (
                <span key={i} className="block">
                  {i === 0 ? (
                    line
                  ) : (
                    <span className="text-[#2D7D3A]">{line}</span>
                  )}
                </span>
              ))}
            </h1>

            <p className="mt-2.5 max-w-[440px] text-sm leading-relaxed text-muted sm:text-base">
              {hero.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/search"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2D7D3A] px-6 text-sm font-bold text-white shadow-lg shadow-[#2D7D3A]/25 transition-all hover:bg-[#23682E] active:scale-[0.97]"
              >
                Shop Fresh Now <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/account"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D6E8D9] bg-white px-6 text-sm font-bold text-[#23682E] transition-all hover:border-[#2D7D3A]/40 hover:bg-[#F6FBF7] active:scale-[0.97]"
              >
                My Account
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {trustPoints.map((p) => (
                <span key={p.text} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2D7D3A]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2D7D3A]/10">
                    <Check className="h-3 w-3 text-[#2D7D3A]" strokeWidth={3} />
                  </span>
                  {p.text}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden shrink-0 sm:block">
            <div className="h-44 w-44 overflow-hidden rounded-[30px] ring-8 ring-white/70 shadow-xl lg:h-56 lg:w-56">
              <Image
                src={hero.image}
                alt="Fresh fish and produce from Siliguri Fresh Mart"
                fill
                priority
                sizes="224px"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -left-3 rounded-full bg-[#2D7D3A] px-4 py-2 text-xs font-bold text-white shadow-lg">
              Fresh. Every morning.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}