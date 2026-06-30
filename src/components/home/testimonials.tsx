"use client";

import { Star, Leaf } from "lucide-react";

type Testimonial = {
  productImage: string;
  name: string;
  rating: number;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    productImage: "https://images.unsplash.com/photo-1544943910-04c54e739fe9?w=400&q=80",
    name: "Priya Sharma",
    rating: 5,
    quote: "Khubsurat freshness, darun quality!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80",
    name: "Rahul Mukherjee",
    rating: 5,
    quote: "Fatafati packing, on time. Valo!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80",
    name: "Vikram Chettri",
    rating: 4,
    quote: "Ekdom fresh. Best in Siliguri!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
    name: "Sneha Pradhan",
    rating: 5,
    quote: "Nice and fresh. Simple!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1619566636852-adf3ef00000b?w=400&q=80",
    name: "Anjali Das",
    rating: 5,
    quote: "Darun sweet! Great job!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80",
    name: "Amit Bose",
    rating: 5,
    quote: "Best online service. Nice!",
  },
  {
    productImage: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80",
    name: "Ritika Gurung",
    rating: 4,
    quote: "Valo quality. Very satisfied!",
  },
];

export function FreshnessBanner() {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#E8A440]/15">
          <Leaf className="h-6 w-6 text-[#E8A440]" />
        </span>
        <div>
          <h3 className="text-base font-extrabold text-white">100% Freshness Guarantee</h3>
          <p className="mt-0.5 text-xs text-white/50 leading-relaxed">
            Not satisfied? <strong className="text-[#4CAF50]">Free replacement</strong> within 3 hours. No questions asked.
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
      <div className="flex gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="relative flex-shrink-0 w-[72vw] max-w-[280px] sm:w-auto sm:max-w-none rounded-2xl overflow-hidden aspect-[4/5] group"
          >
            <img
              src={t.productImage}
              alt={t.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-center text-center gap-1.5">
              <div className="flex gap-[1px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "text-brand-fresh fill-current" : "text-white/30"}`} />
                ))}
              </div>
              <p className="text-xs font-semibold text-white leading-snug">"{t.quote}"</p>
              <p className="text-[11px] font-medium text-brand-fresh">— {t.name}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
