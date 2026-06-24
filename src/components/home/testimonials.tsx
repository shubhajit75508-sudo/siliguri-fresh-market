"use client";

import { Star, Leaf, MapPin } from "lucide-react";

type Testimonial = {
  image: string;
  name: string;
  rating: number;
  quote: string;
  daysAgo: number;
};

const testimonials: Testimonial[] = [
  {
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
    name: "Priya Sharma",
    rating: 5,
    quote: "The freshest fish I've had in Siliguri! The cleaning service is amazing — they cut exactly how I wanted.",
    daysAgo: 1,
  },
  {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
    name: "Rahul Mukherjee",
    rating: 5,
    quote: "Ordered at 7am, got it by 7:30! Super fast delivery and the chicken was farm-fresh. Highly recommend!",
    daysAgo: 2,
  },
  {
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face",
    name: "Anjali Das",
    rating: 5,
    quote: "Their fish cleaning is next level. Cut precisely how I wanted. Absolute lifesaver for busy mornings!",
    daysAgo: 3,
  },
  {
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
    name: "Vikram Chettri",
    rating: 4,
    quote: "Great quality mutton, well-packed and delivered on time. The freshness guarantee is real — very impressed.",
    daysAgo: 4,
  },
  {
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=face",
    name: "Sneha Pradhan",
    rating: 5,
    quote: "Best online fresh market in Siliguri! Fruits were perfectly ripe and vegetables were garden-fresh.",
    daysAgo: 5,
  },
  {
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
    name: "Amit Bose",
    rating: 5,
    quote: "Switched from local market to Siliguri Fresh Mart — never going back. Quality is consistently excellent.",
    daysAgo: 6,
  },
  {
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
    name: "Ritika Gurung",
    rating: 4,
    quote: "Love the cleaning options for fish and chicken. Saves so much time in the kitchen. Five stars for service!",
    daysAgo: 7,
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
    <section className="py-4">
      <h2 className="section-title mb-4">What Our Customers Say</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.name} className="glass rounded-2xl border border-white/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src={t.image}
                alt={t.name}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-[#2ecc71]/30 shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex gap-[1px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < t.rating ? "text-[#2ecc71] fill-current" : "text-[#3d4d54]"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#80949b] ml-1">{t.daysAgo}d ago</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#c2d0c9] leading-relaxed">"{t.quote}"</p>
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
