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
    image: raw?.image || "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782317544/file_0000000086c471fd894712adc4d3fa68_vadejf.png",
    title: raw?.title || "Fresh Fish, Chicken,\ndelivered in minutes.",
    subtitle: raw?.subtitle || "From the morning market to your kitchen.",
  };

  return (
    <section className="pt-2 pb-2 sm:pt-4">
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] shadow-xl">
        <div className="relative min-h-[520px] sm:min-h-[460px] lg:min-h-[540px]">
          <img
            src={hero.image}
            alt="Siliguri Fresh Mart"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="flex flex-1 flex-row flex-wrap items-start justify-between gap-4 lg:gap-8 lg:flex-nowrap lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[520px]"
            >
              <div className="mb-8 sm:mb-5 inline-flex items-center gap-2.5 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
                <span className="live-dot h-2 w-2 rounded-full bg-[#2D7D3A] shadow-[0_0_8px_#2D7D3A]" />
                <span className="text-[13px] sm:text-[12px] font-semibold tracking-wide text-white">
                  Live — Delivering in 30–60 min
                </span>
              </div>

              <h1 className="text-[28px] font-bold leading-[1.3] tracking-[-0.03em] text-white sm:text-[42px] lg:text-[48px]">
                {hero.title.split("\n").map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </h1>

              <p className="mt-6 sm:mt-4 max-w-[420px] text-[16px] leading-relaxed text-white/80 sm:text-base">
                {hero.subtitle}
              </p>

              <div className="mt-7 sm:mt-7 flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex h-12 sm:h-12 items-center rounded-full bg-[#2D7D3A] px-6 sm:px-7 text-[15px] sm:text-[14px] font-semibold text-white shadow-lg shadow-[#2D7D3A]/25 transition-all hover:bg-[#23682E] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Shop fresh now
                </Link>
                <Link
                  href="/account"
                  className="inline-flex h-12 items-center rounded-full bg-white/20 backdrop-blur-sm px-6 sm:px-7 text-[15px] sm:text-[14px] font-semibold text-white transition-all hover:bg-white/30"
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
              className="hidden sm:block max-w-[120px] sm:max-w-[300px] bg-white/15 backdrop-blur-sm rounded-2xl p-3 sm:p-5 shrink-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#66BB6A]">
                Today&apos;s Catch
              </p>
              <h3 className="mt-1.5 text-[14px] font-bold tracking-tight text-white sm:text-[22px]">Padma Hilsa</h3>
              <p className="mt-0.5 text-[10px] text-white/60 sm:mt-1 sm:text-[12px]">Harvested at dawn — iced & sealed</p>

              <div className="mt-3 sm:mt-5">
                {timeline.map((step, i) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          step.active
                            ? "bg-[#2D7D3A] shadow-[0_0_0_4px_rgba(45,125,58,0.3)]"
                            : step.done
                              ? "bg-[#2D7D3A]"
                              : "bg-white/30"
                        }`}
                      />
                      {i < timeline.length - 1 && (
                        <div className={`my-0.5 h-4 w-px sm:my-1 sm:h-9 ${step.done ? "bg-[#2D7D3A]/50" : "bg-white/20"}`} />
                      )}
                    </div>
                    <div className={i < timeline.length - 1 ? "pb-1 sm:pb-3" : ""}>
                      <p className="text-[11px] font-semibold text-white sm:text-[13px]">{step.label}</p>
                      <p className="text-[9px] text-white/50 sm:text-[11px]">{step.time}</p>
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
            className="mt-6 sm:mt-6 flex gap-1.5 sm:gap-2"
          >
            {[
              { icon: Clock, text: "30-min ETA" },
              { icon: ShieldCheck, text: "Freshness 100%" },
              { icon: Truck, text: "Free over Rs.299" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/20 backdrop-blur-sm px-2.5 sm:px-4 py-2 sm:py-2.5"
              >
                <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#66BB6A]" strokeWidth={2.5} />
                <span className="text-[10px] sm:text-[12px] font-medium text-white whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
