"use client";

export function SplashLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#1A1512]">
      <div className="relative">
        <img
          src="https://res.cloudinary.com/dc5fh5afb/image/upload/w_192,h_192,c_fill/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg"
          alt="Fresh Mart"
          className="h-20 w-20 rounded-2xl object-cover shadow-2xl shadow-brand-fresh/20 animate-pulse"
        />
        <div className="absolute -inset-3 rounded-2xl border-2 border-brand-fresh/40 animate-[spin_2s_linear_infinite] [clip-path:inset(0_0_50%_0)]" />
        <div className="absolute -inset-3 rounded-2xl border-2 border-brand-fresh/20 animate-[spin_2s_linear_infinite] [clip-path:inset(50%_0_0_0)] [animation-direction:reverse]" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-base font-extrabold text-[#2E1509] tracking-tight">
          Siliguri Fresh Mart
        </p>
        <p className="text-[11px] font-medium text-muted tracking-wider uppercase">
          Fresh Market Delivered
        </p>
      </div>

      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand-fresh"
            style={{
              animation: `bounce 1.2s ${i * 0.15}s infinite`,
              animationTimingFunction: "ease-in-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
