"use client";

import { Star, Truck, Shield, Package } from "lucide-react";

const stats = [
  { icon: Package, value: "5,000+", label: "Orders Delivered" },
  { icon: Star, value: "4.8/5", label: "Customer Rating" },
  { icon: Truck, value: "30-min", label: "Avg Delivery" },
  { icon: Shield, value: "100%", label: "Secure Payment" },
];

export function TrustBar() {
  return (
    <div className="glass rounded-2xl border border-white/5 px-6 py-4 flex items-center justify-around flex-wrap gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-3 text-center sm:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2ecc71]/10">
              <Icon className="h-5 w-5 text-[#2ecc71]" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-[#80949b] font-medium">{s.label}</p>
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
    <section className="py-4">
      <h2 className="section-title mb-4">Why Choose Us</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {reasons.map((r) => (
          <div key={r.title} className="glass rounded-2xl border border-white/5 p-5">
            <span className="text-2xl">{r.icon}</span>
            <h3 className="mt-3 text-sm font-bold text-white">{r.title}</h3>
            <p className="mt-1 text-xs text-[#80949b] leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
