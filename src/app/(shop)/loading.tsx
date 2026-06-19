"use client";

import { Loader2 } from "lucide-react";

export default function ShopLoading() {
  return (
    <div className="py-6 space-y-8 max-w-7xl mx-auto px-4">
      <div className="skeleton h-[460px] rounded-[32px]" />
      <div className="skeleton h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
