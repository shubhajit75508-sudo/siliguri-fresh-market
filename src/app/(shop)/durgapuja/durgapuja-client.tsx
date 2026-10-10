"use client";

import Link from "next/link";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ChevronRight,
  ChevronDown,
  Truck,
  Clock,
  Star,
  MapPin,
  Phone,
  Sparkles,
  Fish,
  Drumstick,
  Beef,
  Milk,
  Salad,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { DURGA_PUJA_SEO } from "@/lib/durgapuja-seo";
import { DELIVERY_ZONES } from "@/lib/zones";
import { FAQSchema } from "@/components/seo/schemas";

const PUJA_DAYS = [
  {
    day: "Shashthi",
    date: "Sat, 17 Oct",
    label: "Bodhon & Amontron",
    desc: "The puja formally begins. Fresh hilsa and prawns for the festive dinner when guests arrive.",
  },
  {
    day: "Saptami",
    date: "Sun, 18 Oct",
    label: "Kola Bou Snan & Nabapatrika",
    desc: "The banana bride is bathed. Bhog favourites like khichuri start early — stock up on vegetables and fritters.",
  },
  {
    day: "Ashtami",
    date: "Mon, 19 Oct",
    label: "Anjali & Kumor Bhog",
    desc: "The biggest day. Order mutton or chicken the night before for the family spread after anjali.",
  },
  {
    day: "Navami",
    date: "Tue, 20 Oct",
    label: "Maha Navami",
    desc: "Another full day of bhog and get-togethers. Fresh rohu, katla and prawns keep every thali special.",
  },
  {
    day: "Dashami",
    date: "Wed, 21 Oct",
    label: "Sindoor Khela & Visarjan",
    desc: "Goodbye to Maa. A light, fresh fish jhol with the family before the visarjan rush.",
  },
];

const STAPLES = [
  {
    name: "Fresh Fish",
    href: "/fish",
    icon: Fish,
    note: "Hilsa, Rohu, Katla, Prawns — scaled, gutted & cut to order for the pujo thali",
  },
  {
    name: "Chicken",
    href: "/category/chicken",
    icon: Drumstick,
    note: "Broiler & farm-fresh — the star of Ashtami and Navami family bhog",
  },
  {
    name: "Mutton",
    href: "/category/mutton",
    icon: Beef,
    note: "Premium cuts slow-cooked to perfection for the puja feast",
  },
  {
    name: "Dairy & Eggs",
    href: "/category/dairy",
    icon: Milk,
    note: "Eggs, paneer & dairy essentials for the puja breakfast table",
  },
  {
    name: "Vegetables",
    href: "/category/vegetables",
    icon: Salad,
    note: "Farm-fresh veggies for bhog khichuri, bhaja & family lunches",
  },
];

const BENEFITS = [
  "Sourced fresh every morning from Siliguri's local markets",
  "Free delivery above ₹299 · Same-day doorstep delivery",
  "Your choice of cut & cleaning — just like the market",
  "Order online, by WhatsApp or just pick up the phone",
];

export function DurgaPujaClient() {
  const seo = DURGA_PUJA_SEO;

  return (
    <div className="py-6 sm:py-8">
      <FAQSchema questions={seo.faq.map((f) => ({ question: f.question, answer: f.answer }))} />

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">Durga Puja 2026 Special</span>
      </nav>

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1E3A2F] via-[#2D5A3D] to-[#1E3A2F] shadow-xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#F4B942]/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#F4B942]/10 blur-2xl" />
        <div className="relative p-6 sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4B942]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#F4B942]">
            <Sparkles className="h-3.5 w-3.5" /> Festive Special · 17 – 21 October
          </span>
          <h1 className="mt-4 max-w-xl text-[26px] sm:text-[38px] font-extrabold tracking-tight text-white leading-tight">
            {seo.heroHeading}
          </h1>
          <p className="mt-3 max-w-xl text-[14px] text-white/75 leading-relaxed">
            {seo.heroSub}
          </p>

          {/* Day pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ["Shashthi", "17"],
              ["Saptami", "18"],
              ["Ashtami", "19"],
              ["Navami", "20"],
              ["Dashami", "21"],
            ].map(([name, date]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {name}
                <span className="text-white/60">· {date} Oct</span>
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
              <Clock className="h-3.5 w-3.5" /> 1–2 hrs delivery
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

      {/* Benefits */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div
            key={b}
            className="flex items-start gap-2.5 rounded-2xl border border-border bg-surface p-4"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2D7D3A]" />
            <p className="text-sm text-foreground leading-snug">{b}</p>
          </div>
        ))}
      </div>

      {/* Puja day planner */}
      <div className="mb-8">
        <h2 className="text-lg font-extrabold text-foreground mb-1">The Pujo Day Planner</h2>
        <p className="text-xs text-muted mb-4">
          Bodhon to Dashami — what to order, when. Order the night before or before 11 AM for the Morning Slot.
        </p>
        <div className="grid gap-3 sm:grid-cols-5">
          {PUJA_DAYS.map((d) => (
            <div
              key={d.day}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-[#2D7D3A]/40 hover:shadow-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#2D7D3A]">{d.date}</p>
              <p className="mt-1 text-[15px] font-extrabold text-foreground">{d.day}</p>
              <p className="text-[11px] font-semibold text-muted">{d.label}</p>
              <p className="mt-2 text-xs text-muted leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order now strip */}
      <div className="mb-8 rounded-2xl border border-[#2D7D3A]/20 bg-gradient-to-r from-[#EAF4EC] to-[#FDF6E7] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-foreground">Ready for Pujo? Stock your kitchen today.</p>
            <p className="text-xs text-muted mt-0.5">
              Same-day delivery across Siliguri · Free above ₹299 · Cut to your liking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/fish"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D7D3A] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#23682E] active:scale-[0.97]"
            >
              <Fish className="h-4 w-4" /> Shop Fish
            </Link>
            <Link
              href="https://wa.me/917029908278?text=Hi!%20I%27d%20like%20to%20plan%20my%20Durga%20Puja%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#1EB856] active:scale-[0.97]"
            >
              Order on WhatsApp
            </Link>
            <a
              href="tel:+917029908278"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-[#2D7D3A]/40 active:scale-[0.97]"
            >
              <Phone className="h-4 w-4 text-[#2D7D3A]" /> Call
            </a>
          </div>
        </div>
      </div>

      {/* Puja staples */}
      <div className="mb-8">
        <h2 className="text-lg font-extrabold text-foreground mb-1">Pujo Staples</h2>
        <p className="text-xs text-muted mb-4">
          Everything you need for bhog, anjali and the family feast — stocked fresh through 17–21 October.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STAPLES.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-all hover:border-[#2D7D3A]/40 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2D7D3A] text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-[#2D7D3A]">
                  {s.name}
                </p>
                <p className="mt-0.5 text-xs text-muted leading-relaxed">{s.note}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-[#2D7D3A]" />
            </Link>
          ))}
        </div>
      </div>

      {/* Delivery info */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Same-Day Delivery</p>
              <p className="text-xs text-muted">{seo.deliveryInfo}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">All of Siliguri</p>
              <p className="text-xs text-muted">From Shantipara to Bagdogra — we deliver to every pujo pandal street.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Need Help?</p>
              <p className="text-xs text-muted">Call +91 7029908278 for custom cuts & bulk pujo orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-extrabold text-foreground mb-3">{seo.contentHeading}</h2>
        <p className="text-sm text-muted leading-relaxed">{seo.content}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Hilsa", "Rohu", "Katla", "Prawns", "Chicken", "Mutton"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#2D7D3A]/20 bg-[#2D7D3A]/5 px-3 py-1 text-xs font-medium text-[#2D7D3A]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-base font-extrabold text-foreground mb-4">
          Durga Puja Delivery — FAQs
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

      {/* Delivery Areas */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-extrabold text-foreground mb-3">
          We Deliver Pujo Orders Across Siliguri
        </h2>
        <p className="text-xs text-muted mb-4">
          Fresh fish & puja essentials delivered to all these areas:
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

      {/* Final CTA */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#1E3A2F] to-[#2D5A3D] p-6 text-center shadow-lg">
        <p className="text-lg font-extrabold text-white">
          Shubho Durgotsav 2026 — from Siliguri Freshmart
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs text-white/70">
          Order before 11 AM and your fish, chicken or mutton reaches your door the same day.
          শুভ দুর্গাপুজো!
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link
            href="/category/chicken"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1E3A2F] transition-all hover:bg-[#F4B942] active:scale-[0.97]"
          >
            Shop Puja Essentials <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}