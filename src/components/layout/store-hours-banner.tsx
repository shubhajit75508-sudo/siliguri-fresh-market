"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getStoreStatus } from "@/lib/store-hours";

export function StoreHoursBanner() {
  const [status, setStatus] = useState(getStoreStatus);

  useEffect(() => {
    const id = setInterval(() => setStatus(getStoreStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  const tone = status.isOpen
    ? "bg-[#2D7D3A] text-white"
    : "bg-amber-100 text-amber-900 border-b border-amber-200";

  return (
    <div className={`${tone} w-full`}>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold">
        <Clock className={`h-3.5 w-3.5 shrink-0 ${status.isOpen ? "" : "text-amber-600"}`} />
        <span>
          {status.headline}
          <span className={`ml-1.5 font-normal opacity-80 hidden sm:inline`}>
            · {status.subtext}
          </span>
        </span>
      </div>
    </div>
  );
}
