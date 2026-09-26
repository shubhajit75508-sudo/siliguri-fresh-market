"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="adm-panel w-full max-w-md p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10">
          <AlertTriangle className="h-6 w-6 text-[#f87171]" />
        </div>

        <p className="adm-eyebrow mt-5">System fault</p>
        <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Something broke</h1>
        <p className="mt-2 text-sm text-muted">
          The console could not finish loading this screen. Retrying usually clears it.
        </p>

        {error.message ? (
          <pre className="adm-num mt-5 max-h-32 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-left text-[11px] leading-relaxed text-[#f87171]">
            {error.message}
          </pre>
        ) : null}

        <button
          onClick={reset}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#ff9a3c] px-6 text-sm font-bold text-black transition-transform hover:opacity-95 active:scale-[0.99]"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
