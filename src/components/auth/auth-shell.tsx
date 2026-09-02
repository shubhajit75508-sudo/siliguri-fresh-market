"use client";

import Link from "next/link";
import { Leaf, Truck, ShieldCheck, Clock } from "lucide-react";

const logo =
  "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg";

const trust = [
  { icon: Clock, text: "Delivery in 30–60 min" },
  { icon: Truck, text: "Free delivery on all orders" },
  { icon: ShieldCheck, text: "100% freshness guarantee" },
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, icon, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#EAF3EB] via-[#F5F8F5] to-[#FDF6E8]">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-[#2D7D3A]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#F5A623]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#4FA8D8]/8 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 lg:flex-row lg:gap-16 lg:px-8">
        {/* Brand panel (desktop only) */}
        <div className="hidden w-full max-w-md shrink-0 lg:block">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2D7D3A] via-[#2E8B3C] to-[#23682E] p-8 shadow-2xl shadow-[#2D7D3A]/25">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#F5A623]/20 blur-3xl" />

            <div className="relative">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  <img src={logo} alt="Siliguri Fresh Mart" className="h-14 w-14 object-contain" />
                </span>
                <div>
                  <p className="text-lg font-extrabold leading-tight text-white">Siliguri Fresh Mart</p>
                  <p className="text-[11px] font-medium text-white/70">Fresh Market, delivered.</p>
                </div>
              </Link>

              <h2 className="mt-8 text-[26px] font-extrabold leading-snug text-white">
                Fresh from the morning market to your kitchen.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Fish, chicken, mutton, vegetables and daily essentials — hand-picked every morning and delivered fresh to your door.
              </p>

              <div className="mt-8 space-y-3">
                {trust.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <Icon className="h-4 w-4 text-[#F8C762]" />
                    </span>
                    <span className="text-sm font-medium text-white">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-7 shadow-2xl shadow-black/5 ring-1 ring-black/5 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-dark to-brand-dark/80 shadow-md shadow-brand-dark/20">
                {icon}
              </div>
              <h1 className="text-2xl font-extrabold">{title}</h1>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            </div>

            {children}
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted">
            <Leaf className="h-3.5 w-3.5 text-[#2D7D3A]" />
            100% Freshness Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
}
