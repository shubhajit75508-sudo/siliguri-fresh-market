"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Star, ShieldCheck, Package, ArrowRight, User } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";

const trustStats = [
  { icon: Package, value: "5K+", label: "Orders" },
  { icon: Star, value: "4.8", label: "Rating" },
  { icon: Clock, value: "45m", label: "Delivery" },
  { icon: ShieldCheck, value: "100%", label: "Secure" },
];

const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dc5fh5afb/image/upload/v1782317544/file_0000000086c471fd894712adc4d3fa68_vadejf.png";

export function HeroSection() {
  const { settings } = useAdminStore();
  const raw = settings?.hero;

  const image = raw?.image || DEFAULT_IMAGE;
  const title = raw?.title || "Fresh Fish, Chicken,\ndelivered fresh to your door.";
  const subtitle = raw?.subtitle || "From the morning market to your kitchen.";
  const titleLines = title.split("\n");

  return (
    <section className="pb-0 pt-2 sm:pt-4">
      <div className="card-white overflow-hidden">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:p-8">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE6D4] bg-[#F2FAF2] px-2.5 py-1 sm:px-3 sm:py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2D7D3A] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2D7D3A] shadow-[0_0_8px_#2D7D3A]" />
              </span>
              <span className="text-[10px] font-bold tracking-wide text-[#2D7D3A] sm:text-[12px]">
                Live · Delivering in 1–2 hrs
              </span>
            </span>

            <h1 className="mt-3 text-[24px] font-extrabold leading-[1.2] tracking-[-0.03em] text-foreground sm:text-[32px] lg:text-[40px]">
              {titleLines.map((line, i) => (
                <span key={i} className="block">
                  {i === 0 ? line : <span className="text-[#2D7D3A]">{line}</span>}
                </span>
              ))}
            </h1>

            <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-muted sm:text-[15px]">
              {subtitle}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
              <Link
                href="/search"
                className="btn-primary inline-flex h-11 items-center justify-center gap-1.5 px-5 text-[13px] sm:h-12 sm:px-6 sm:text-[14px]"
              >
                Shop fresh now <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/account"
                className="btn-secondary inline-flex h-11 items-center justify-center gap-1.5 px-4 text-[13px] sm:h-12 sm:px-5 sm:text-[14px]"
              >
                <User className="h-4 w-4" strokeWidth={2.2} />
                My Account
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F7FAF8]">
              <Image
                src={image}
                alt="Fresh fish, chicken and vegetables from Siliguri Freshmart"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 36vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center border-t border-[var(--color-border)] bg-[#FBFDFB] px-1 sm:px-3">
          {trustStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Fragment key={stat.label}>
                <div className="flex flex-1 flex-col items-center gap-0.5 py-2.5 sm:py-3">
                  <Icon className="h-4 w-4 text-[#2D7D3A]" strokeWidth={2.2} />
                  <span className="text-[13px] font-extrabold leading-tight text-foreground sm:text-base">
                    {stat.value}
                  </span>
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-muted sm:text-[9.5px]">
                    {stat.label}
                  </span>
                </div>
                {i < trustStats.length - 1 && (
                  <div className="h-8 w-px bg-[var(--color-border)]" />
                )}
              </Fragment>
            );
          })}
        </div>

        <p className="border-t border-[var(--color-border)] px-3 py-1.5 text-center text-[9.5px] font-semibold text-muted sm:text-[11px]">
          Free delivery above ₹299 · Sourced from this morning&apos;s market
        </p>
      </div>
    </section>
  );
}
