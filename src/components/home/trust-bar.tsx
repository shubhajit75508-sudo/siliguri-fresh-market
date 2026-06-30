"use client";

import { Star, Truck, Shield, Package } from "lucide-react";

const stats = [
  { icon: Package, value: "5K+", label: "Orders" },
  { icon: Star, value: "4.8", label: "Rating" },
  { icon: Truck, value: "30m", label: "Delivery" },
  { icon: Shield, value: "100%", label: "Secure" },
];

export function TrustBar() {
  return (
    <div className="glass-card px-4 py-3 grid grid-cols-4 gap-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-2 justify-center sm:justify-start">
            <Icon className="h-4 w-4 text-brand-gold shrink-0" />
            <div>
              <p className="text-[13px] font-extrabold text-brand-gold leading-none">{s.value}</p>
              <p className="text-[10px] text-white/70 font-medium">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WhyChooseUs() {
  const reasons = [
    { icon: "🌿", title: "Farm Fresh Daily", desc: "Sourced from local markets every morning. You get the freshest catch." },
    { icon: "🔄", title: "Easy Returns", desc: "Not satisfied? Get a free replacement within 3 hours. No questions asked." },
    { icon: "🔒", title: "Secure Checkout", desc: "Razorpay encrypted payments. UPI, Cards, Netbanking & Cash on Delivery." },
  ];

  return (
    <section className="py-3">
      <h2 className="section-title mb-3">Why Choose Us</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {reasons.map((r) => (
          <div key={r.title} className="glass-card px-3 py-3 flex-shrink-0 w-[65vw] max-w-[240px] sm:w-auto sm:max-w-none">
            <span className="text-lg">{r.icon}</span>
            <h3 className="mt-1.5 text-xs font-bold text-foreground">{r.title}</h3>
            <p className="mt-0.5 text-[11px] text-muted leading-snug hidden sm:block">{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
