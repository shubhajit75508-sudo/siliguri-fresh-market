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
    productImage: "https://images.unsplash.com/photo-1544943910-04c54e739fe9?w=300&q=80",
    productName: "Fresh Rohu Fish",
    name: "Priya Sharma",
    rating: 5,
    quote: "Khubsurat freshness, darun quality!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80",
    productName: "Country Chicken",
    name: "Rahul Mukherjee",
    rating: 5,
    quote: "Fatafati packing, on time delivery. Valo!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80",
    productName: "Mutton Curry Cut",
    name: "Vikram Chettri",
    rating: 4,
    quote: "Great quality. Ekdom fresh. Best in Siliguri!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80",
    productName: "Organic Vegetables",
    name: "Sneha Pradhan",
    rating: 5,
    quote: "Nice and fresh. Exactly like the photos. Simple!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1619566636852-adf3ef00000b?w=300&q=80",
    productName: "Fresh Fruits",
    name: "Anjali Das",
    rating: 5,
    quote: "Darun sweet! Much better than market. Great job!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80",
    productName: "Farm Eggs",
    name: "Amit Bose",
    rating: 5,
    quote: "Best online service. Regularly ordering. Nice!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&q=80",
    productName: "Tiger Prawns",
    name: "Ritika Gurung",
    rating: 4,
    quote: "Valo quality. Cleaned nicely. Very satisfied!",
  },
];

const deliveryAreas = [
  "Hakimpara", "Pradhan Nagar", "Matigara", "Bagdogra",
  "Siliguri Town", "Champasari", "Sukna", "Burdwan Road",
];

export function FreshnessBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d2b1a] via-[#133a23] to-[#1A5C36] border border-[#2ecc71]/20 p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2ecc71]/15">
          <Leaf className="h-7 w-7 text-[#2ecc71]" />
        </span>
        <div className="flex-1">
          <h3 className="text-base font-extrabold text-white leading-tight">100% Freshness Guarantee</h3>
          <p className="mt-1 text-xs text-[#b7c9c2] leading-relaxed sm:text-sm">
            Not satisfied? <strong className="text-[#2ecc71]">Free replacement</strong> or money back within 3 hours. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-6">
      <h2 className="section-title mb-5">What Customers Say</h2>
      <div className="flex gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
        {testimonials.map((t) => (
          <div key={t.name} className="glass rounded-2xl border border-white/5 p-3 flex-shrink-0 w-[75vw] max-w-[300px] sm:w-auto sm:max-w-none flex flex-col items-center text-center gap-2.5">
            <img
              src={t.productImage}
              alt={t.productName}
              className="h-28 w-28 rounded-2xl object-cover shadow-xl shadow-black/40"
              loading="lazy"
            />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < t.rating ? "text-[#2ecc71] fill-current" : "text-[#3d4d54]"}`} />
              ))}
            </div>
            <p className="text-xs font-semibold text-white leading-snug px-1">"{t.quote}"</p>
            <p className="text-[11px] font-medium text-[#2ecc71]">— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DeliveryArea() {
  return (
    <div className="glass rounded-2xl border border-white/5 px-5 py-4">
      <span className="flex items-center gap-2 text-[#2ecc71] mb-3">
        <MapPin className="h-4 w-4" />
        <span className="text-xs font-bold">We deliver across Siliguri</span>
      </span>
      <div className="flex flex-wrap gap-2">
        {deliveryAreas.map((area) => (
          <span key={area} className="glass rounded-lg border border-white/5 px-2.5 py-1 text-[10px] text-[#b7c9c2] font-medium">{area}</span>
        ))}
      </div>
    </div>
  );
}
