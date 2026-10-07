"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * Branded first-paint splash.
 *
 * Deliberately CSS-only (no framer-motion) so it stays out of the root
 * critical JS chunk, and gated on sessionStorage so it runs once per browser
 * session instead of covering the screen on every navigation.
 *
 * It renders in the "hidden" state (opacity 0 / no pointer events) so the
 * SSR HTML never occludes page content while the bundle hydrates; visibility
 * is toggled with classList in an effect rather than setState, which keeps
 * this out of the cascade the `react-hooks/set-state-in-effect` rule warns
 * about.
 */
const STORAGE_KEY = "sf:splash-seen";

export function RootSplash() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let seen = true;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
      if (!seen) sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode / storage disabled — skip the splash rather than block.
      return;
    }
    if (seen) return;

    el.classList.add("sf-splash-show");
    const exit = setTimeout(() => el.classList.add("sf-splash-exit"), 350);
    const cleanup = setTimeout(() => el.remove(), 850);
    return () => {
      clearTimeout(exit);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="sf-splash-root fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#F5F8F5]"
    >
      <div className="relative">
        <Image
          src="/icons/icon-192x192.png"
          alt="Siliguri Freshmart"
          width={80}
          height={80}
          className="h-20 w-20 rounded-2xl object-cover shadow-2xl"
        />
        <div
          className="absolute -inset-3 rounded-2xl border-2 border-brand-fresh/40 [clip-path:inset(0_0_50%_0)]"
          style={{ animation: "splash-spin 2s linear infinite" }}
        />
        <div
          className="absolute -inset-3 rounded-2xl border-2 border-brand-fresh/20 [clip-path:inset(50%_0_0_0)]"
          style={{ animation: "splash-spin 2s linear infinite reverse" }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-base font-extrabold tracking-tight text-[#2E1509]">
          Siliguri Freshmart
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Fresh Market Delivered
        </p>
      </div>

      <div className="mt-1 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand-fresh"
            style={{
              animation: `splash-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-spin { to { transform: rotate(360deg); } }
        @keyframes splash-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes splash-fade { to { opacity: 0; transform: scale(1.04); } }
        .sf-splash-root {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .sf-splash-show {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .sf-splash-exit { animation: splash-fade 0.35s ease-in-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .sf-splash-exit { animation: splash-fade 0.01s linear forwards; }
        }
      `}</style>
    </div>
  );
}
