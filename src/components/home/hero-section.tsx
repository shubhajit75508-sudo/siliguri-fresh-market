"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";

export function HeroSection() {
  const { settings } = useAdminStore();
  const raw = settings?.hero;
  const hero = {
    image: raw?.image || "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782317544/file_0000000086c471fd894712adc4d3fa68_vadejf.png",
    title: raw?.title || "Fresh Fish, Chicken,\ndelivered fresh to your door.",
    subtitle: raw?.subtitle || "From the morning market to your kitchen.",
  };

  return (
    <section className="pt-2 pb-1 sm:pt-4">
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] bg-gradient-to-br from-[#1B5E20] via-[#2D7D3A] to-[#3E9B4E] shadow-[0_10px_30px_rgba(27,94,32,0.25)]">
        <div className="absolute inset-0">
          <Image
            src={hero.image}
            alt="Siliguri Fresh Mart — fresh fish, chicken, mutton & vegetables delivery in Siliguri"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#173F1D]/80 via-[#1B5E20]/55 to-[#2D7D3A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#123316]/60 via-transparent to-transparent" />
        </div>

        <div className="relative min-h-[210px] flex flex-col justify-between p-4 sm:min-h-[250px] sm:p-7 lg:min-h-[280px] lg:p-8">
          <div className="flex items-start justify-between gap-3">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm"
            >
              <span className="live-dot h-2 w-2 rounded-full bg-[#A5E0A8] shadow-[0_0_8px_#A5E0A8]" />
              <span className="text-[11px] sm:text-[12px] font-semibold tracking-wide text-white">
                Live — Delivering in 45–60 min
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 max-w-[560px]"
          >
            <h1 className="text-[24px] font-extrabold leading-[1.25] tracking-[-0.03em] text-white sm:text-[34px] lg:text-[40px]">
              {hero.title.split("\n").map((line, i) => (
                <span key={i}>{i > 0 && <br />}{line}</span>
              ))}
            </h1>
            <p className="mt-2 max-w-[420px] text-[13px] leading-relaxed text-white/85 sm:text-[15px]">
              {hero.subtitle}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/search"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#F5A623] px-5 text-[13px] font-bold text-[#1E3A14] shadow-lg shadow-[#F5A623]/25 transition-all hover:bg-[#F8C762] hover:scale-[1.02] active:scale-[0.98] sm:h-12 sm:px-6 sm:text-[14px]"
              >
                Shop fresh now <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/account"
                className="inline-flex h-10 items-center rounded-xl bg-white/15 px-5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25 sm:h-12 sm:px-6 sm:text-[14px]"
              >
                My Account
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="mt-3 flex gap-1.5 sm:mt-5 sm:gap-2"
          >
            {[
              { icon: Clock, text: "45–60 min ETA" },
              { icon: ShieldCheck, text: "Freshness 100%" },
              { icon: Truck, text: "Free above ₹299" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2"
              >
                <item.icon className="h-3 w-3 text-[#A5E0A8] sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
                <span className="whitespace-nowrap text-[10px] font-medium text-white sm:text-[12px]">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}