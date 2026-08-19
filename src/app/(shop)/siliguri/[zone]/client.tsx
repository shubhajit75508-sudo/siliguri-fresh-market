"use client";

import Link from "next/link";
import { Truck, Clock, MapPin, Phone, Star, ChevronRight } from "lucide-react";
import { ProductSection } from "@/components/home/product-section";
import { useProductsByCategory } from "@/lib/hooks/use-products";
import type { DeliveryZone } from "@/lib/zones";

export function ZonePageClient({ zone }: { zone: DeliveryZone }) {
  const { data: fish = [] } = useProductsByCategory("fish");
  const { data: chicken = [] } = useProductsByCategory("chicken");
  const { data: mutton = [] } = useProductsByCategory("mutton");
  const { data: vegetables = [] } = useProductsByCategory("vegetables");

  return (
    <div className="py-6 sm:py-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2D7D3A] to-[#1a5c26] p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-white/70" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wide">{zone.label}</span>
          </div>
          <h1 className="text-[24px] sm:text-[30px] font-extrabold leading-tight">
            Fresh Fish & Meat<br />Delivered to {zone.name}
          </h1>
          <p className="mt-3 max-w-md text-[14px] text-white/75 leading-relaxed">
            {zone.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" />
              Delivery in {zone.eta}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold">
              <Truck className="h-3.5 w-3.5" />
              Free delivery above ₹299
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-current" />
              4.8 rating
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Link
              href="/fish"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#2D7D3A] shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
            >
              Order Now
              <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:+917029908278"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
            >
              <Phone className="h-4 w-4" />
              Call Us
            </a>
          </div>
        </div>
      </div>

      {/* Delivery info card */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Delivery to {zone.name}</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Delivery Time</p>
              <p className="text-xs text-muted">{zone.eta} from order confirmation</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Delivery Fee</p>
              <p className="text-xs text-muted">Free above ₹299 · ₹40 below ₹299</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-[#2D7D3A]" />
            <div>
              <p className="font-semibold text-foreground">Need Help?</p>
              <p className="text-xs text-muted">Call +91 7029908278</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product sections */}
      {fish.length > 0 && (
        <ProductSection title="Fresh Fish" subtitle={`Delivered fresh to ${zone.name}`} products={fish.slice(0, 4)} viewAllHref="/fish" />
      )}
      {chicken.length > 0 && (
        <ProductSection title="Chicken" subtitle={`Farm-fresh poultry for ${zone.name}`} products={chicken.slice(0, 4)} viewAllHref="/category/chicken" />
      )}
      {mutton.length > 0 && (
        <ProductSection title="Mutton" subtitle={`Premium cuts delivered to ${zone.name}`} products={mutton.slice(0, 4)} viewAllHref="/category/mutton" />
      )}
      {vegetables.length > 0 && (
        <ProductSection title="Vegetables" subtitle={`Farm to table in ${zone.name}`} products={vegetables.slice(0, 4)} viewAllHref="/category/vegetables" />
      )}

      {/* Other zones */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-foreground mb-3">We also deliver to</h2>
        <div className="flex flex-wrap gap-2">
          {["shantipara", "bhaktinagar", "pradhan-nagar", "hakimpara", "matigara", "bagdogra", "champasari", "sukna"]
            .filter((s) => s !== zone.slug)
            .map((s) => (
              <Link
                key={s}
                href={`/siliguri/${s}`}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-all hover:border-[#2D7D3A]/40 hover:text-[#2D7D3A]"
              >
                {s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
