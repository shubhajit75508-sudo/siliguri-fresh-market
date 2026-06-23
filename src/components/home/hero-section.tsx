"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, Truck } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";

const timeline = [
  { label: "Harvested", time: "Today, 5:12 AM", done: true },
  { label: "Packed", time: "Today, 7:40 AM", done: true },
  { label: "Arriving", time: "~30 min", active: true },
];

export function HeroSection() {
  const { settings } = useAdminStore();
  const raw = settings?.hero;
  const hero = {
    image: raw?.image || "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1800&q=85",
    title: raw?.title || "Fresh Fish, Chicken,\ndelivered in minutes.",
    subtitle: raw?.subtitle || "From the morning market to your kitchen.",
  };

  return (
    <section className="pt-2 pb-2 sm:pt-4">
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-black/15">
        <div className="relative min-h-[360px] sm:min-h-[460px] lg:min-h-[540px]">
          <img src={hero.image}
            alt="Fresh fish and produce"
            className="object-cover scale-105 product-img"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-8 lg:p-10">
          <div className="flex flex-1 flex-row flex-wrap items-start justify-between gap-4 lg:gap-8 lg:flex-nowrap lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[520px]"
            >
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full glass-pill px-4 py-2">
                <span className="live-dot h-2 w-2 rounded-full bg-brand-fresh shadow-[0_0_8px_#22c55e]" />
                <span className="text-[12px] font-semibold tracking-wide text-white/95">
                  Live — Delivering in 30–60 min
                </span>
              </div>

              <h1 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[42px] lg:text-[48px]">
                {hero.title.split("\n").map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </h1>

              <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-white/70 sm:text-base">
                {hero.subtitle}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex h-12 items-center rounded-full bg-[#0d1b2a] px-7 text-[14px] font-semibold text-foreground shadow-lg shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Shop fresh now
                </Link>
                <Link
                  href="/account"
                  className="inline-flex h-12 items-center rounded-full border border-white/35 px-7 text-[14px] font-semibold text-white transition-all hover:bg-white/10"
                >
                  My Account
                </Link>
              </div>
            </motion.div>

            {/* Today's Catch */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="hidden sm:block max-w-[120px] sm:max-w-[300px] glass-dark rounded-[16px] sm:rounded-[24px] p-3 sm:p-5 shrink-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-fresh">
                Today&apos;s Catch
              </p>
              <h3 className="mt-1.5 text-[14px] font-bold tracking-tight text-white sm:text-[22px]">Padma Hilsa</h3>
              <p className="mt-0.5 text-[10px] text-white/55 sm:mt-1 sm:text-[12px]">Harvested at dawn — iced & sealed</p>

              <div className="mt-3 sm:mt-5">
                {timeline.map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          step.active
                            ? "bg-brand-fresh shadow-[0_0_0_4px_rgba(34,197,94,0.25)]"
                            : step.done
                              ? "bg-brand-fresh"
                              : "bg-white/25"
                        }`}
                      />
                      {i < timeline.length - 1 && (
                        <div className={`my-0.5 h-4 w-px sm:my-1 sm:h-9 ${step.done ? "bg-brand-fresh/40" : "bg-white/15"}`} />
                      )}
                    </div>
                    <div className={i < timeline.length - 1 ? "pb-1 sm:pb-3" : ""}>
                      <p className="text-[11px] font-semibold text-white sm:text-[13px]">{step.label}</p>
                      <p className="text-[9px] text-white/45 sm:text-[11px]">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {[
              { icon: Clock, text: "30-min ETA" },
              { icon: ShieldCheck, text: "Freshness 100%" },
              { icon: Truck, text: "Free over ₹299" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 rounded-full glass-pill px-4 py-2.5"
              >
                <item.icon className="h-3.5 w-3.5 text-brand-fresh" strokeWidth={2.5} />
                <span className="text-[12px] font-medium text-white/90">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}