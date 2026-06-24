"use client";

import { Star, Leaf, MapPin } from "lucide-react";

type Testimonial = {
  productImage: string;
  productName: string;
  name: string;
  rating: number;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    productImage: "https://images.unsplash.com/photo-1544943910-04c54e739fe9?w=120&q=80",
    productName: "Fresh Rohu Fish",
    name: "Priya S.",
    rating: 5,
    quote: "Absolutely fresh and perfectly cleaned. Best fish delivery in Siliguri!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=120&q=80",
    productName: "Country Chicken",
    name: "Rahul M.",
    rating: 5,
    quote: "Ordered at 7am, got it by 7:30. Super fast and farm-fresh quality.",
  },
  {
    productImage: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=120&q=80",
    productName: "Mutton Curry Cut",
    name: "Vikram C.",
    rating: 4,
    quote: "Tender, well-packed mutton. Great quality every single time.",
  },
  {
    productImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&q=80",
    productName: "Organic Vegetables",
    name: "Sneha P.",
    rating: 5,
    quote: "Vegetables were garden-fresh and perfectly ripe. Love the quality!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1619566636852-adf3ef00000b?w=120&q=80",
    productName: "Fresh Fruits",
    name: "Anjali D.",
    rating: 5,
    quote: "Fruits were sweet and fresh. Much better than the local market.",
  },
  {
    productImage: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=120&q=80",
    productName: "Farm Eggs",
    name: "Amit B.",
    rating: 5,
    quote: "Switched from local market — never going back. Consistently excellent.",
  },
  {
    productImage: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=120&q=80",
    productName: "Tiger Prawns",
    name: "Ritika G.",
    rating: 4,
    quote: "Love the cleaning options. Saves so much time in the kitchen!",
  },
];

const deliveryAreas = [
  "Hakimpara", "Pradhan Nagar", "Matigara", "Bagdogra",
  "Siliguri Town", "Champasari", "Sukna", "Burdwan Road",
];

export function FreshnessBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A5C36] via-[#0d2b1a] to-[#1A5C36] border border-[#2ecc71]/20 p-5 sm:p-6">
      <div className="flex items-start gap-4 sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2ecc71]/20">
          <Leaf className="h-6 w-6 text-[#2ecc71]" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-extrabold text-white sm:text-base">100% Freshness Guarantee</h3>
          <p className="mt-1 text-xs text-[#c2d0c9] sm:text-sm">
            Not satisfied with the quality? Get a <strong className="text-[#2ecc71]">free replacement</strong> or your money back within 3 hours. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-3">
      <h2 className="section-title mb-3">What Customers Say</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0">
        {testimonials.map((t) => (
          <div key={t.name} className="glass rounded-xl border border-white/5 p-3 flex-shrink-0 w-[75vw] max-w-[280px] sm:w-auto sm:max-w-none flex items-center gap-3">
            <img
              src={t.productImage}
              alt={t.productName}
              className="h-14 w-14 rounded-lg object-cover shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{t.name}</p>
              <div className="flex gap-[1px] my-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < t.rating ? "text-[#2ecc71] fill-current" : "text-[#3d4d54]"}`} />
                ))}
              </div>
              <p className="text-[11px] text-[#80949b] leading-snug line-clamp-2">{t.quote}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DeliveryArea() {
  return (
    <div className="glass rounded-2xl border border-white/5 px-5 py-4 flex items-center gap-3 flex-wrap">
      <span className="flex items-center gap-1.5 text-[#2ecc71] shrink-0">
        <MapPin className="h-4 w-4" /> <span className="text-xs font-bold">We deliver across Siliguri</span>
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {deliveryAreas.map((area) => (
          <span key={area} className="text-[10px] text-[#80949b] font-medium">· {area}</span>
        ))}
      </div>
    </div>
  );
}
