"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { Clock, Star, ShieldCheck, Package, ArrowRight, User } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";

const trustStats = [
  { icon: Package, value: "5K+", label: "Orders", accent: "text-white" },
  { icon: Star, value: "4.8", label: "Rating", accent: "text-[#FFD98A]" },
  { icon: Clock, value: "45m", label: "Delivery", accent: "text-[#A5E0A8]" },
  { icon: ShieldCheck, value: "100%", label: "Secure", accent: "text-white" },
];

export function HeroSection() {
  const { settings } = useAdminStore();
  const raw = settings?.hero;
  const hero = {
    image: raw?.image || "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782317544/file_0000000086c471fd894712adc4d3fa68_vadejf.png",
    title: raw?.title || "Fresh Fish, Chicken,\ndelivered fresh to your door.",
    subtitle: raw?.subtitle || "From the morning market to your kitchen.",
  };

  const lines = hero.title.split("\n");

  return (
    <section className="pt-2 pb-0 sm:pt-4">
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#18521E] via-[#2D7D3A] to-[#3E9B4E] shadow-[0_12px_32px_rgba(27,94,32,0.28)] sm:rounded-[30px]">
        <div className="absolute inset-0">
          <Image
            src={hero.image}
            alt="Siliguri Fresh Mart — fresh fish, chicken, mutton & vegetables delivery in Siliguri"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#173F1D]/85 via-[#1B5E20]/55 to-[#2D7D3A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2E0E]/85 via-transparent to-transparent" />
        </div>

        {/* soft glow accents */}
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="relative flex min-h-[230px] flex-col justify-between gap-3 p-4 pb-3 sm:min-h-[262px] sm:p-7 lg:min-h-[292px] lg:p-8">
          <div className="flex items-start justify-between gap-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 ring-1 ring-white/25 backdrop-blur-sm sm:px-3.5 sm:py-1.5"
            >
              <span className="live-dot relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A5E0A8] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A5E0A8] shadow-[0_0_8px_#A5E0A8]" />
              </span>
              <span className="text-[10px] font-bold tracking-wide text-white sm:text-[12px]">
                Live · Delivering in 45–60 min
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[560px]"
          >
            <h1 className="text-[23px] font-extrabold leading-[1.3] tracking-[-0.03em] text-white drop-shadow-md min-[380px]:text-[26px] sm:text-[34px] lg:text-[42px]">
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
              {hero.subtitle}
            </p>

            <div className="mt-3.5 flex gap-2 sm:mt-5">
              <Link
                href="/search"
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#F8C762] to-[#F5A623] px-4 text-[13px] font-extrabold text-[#1E3A14] shadow-lg shadow-[#F5A623]/30 ring-1 ring-[#E8960A]/40 transition-all hover:brightness-105 active:scale-[0.97] sm:h-12 sm:flex-none sm:px-6 sm:text-[14px]"
              >
                Shop fresh now <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/account"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 text-[12px] font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97] sm:h-12 sm:px-6 sm:text-[14px]"
              >
                <User className="h-4 w-4" strokeWidth={2.5} />
                My Account
              </Link>
            </div>
          </motion.div>

          {/* Integrated trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
            className="rounded-2xl border border-white/10 bg-black/25 px-2 py-2.5 backdrop-blur-md sm:px-4 sm:py-3"
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