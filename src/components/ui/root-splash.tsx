"use client";

import { useEffect, useState } from "react";

export function RootSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#0a1f1c]">
      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splash-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="relative">
        <img
          src="https://res.cloudinary.com/dc5fh5afb/image/upload/w_192,h_192,c_fill/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg"
          alt="Fresh Mart"
          className="h-20 w-20 rounded-2xl object-cover shadow-2xl shadow-[#2ecc71]/20"
        />
        <div className="absolute -inset-3 rounded-2xl border-2 border-[#2ecc71]/40 [clip-path:inset(0_0_50%_0)]" style={{ animation: "splash-spin 2s linear infinite" }} />
        <div className="absolute -inset-3 rounded-2xl border-2 border-[#2ecc71]/20 [clip-path:inset(50%_0_0_0)]" style={{ animation: "splash-spin 2s linear infinite reverse" }} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-base font-extrabold text-white tracking-tight">
          Siliguri Fresh Mart
        </p>
        <p className="text-[11px] font-medium text-[#80949b] tracking-wider uppercase">
          Fresh Market Delivered
        </p>
      </div>

      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#2ecc71]"
            style={{
              animation: `splash-bounce 1.2s ${i * 0.15}s infinite`,
              animationTimingFunction: "ease-in-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
