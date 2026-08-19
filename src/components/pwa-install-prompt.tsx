"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = "pwa-install-dismissed";
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[#2D7D3A]/20 bg-white p-4 shadow-xl shadow-black/10">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-muted hover:bg-surface-alt"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D7D3A]/10">
          <Download className="h-5 w-5 text-[#2D7D3A]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Add to Home Screen</p>
          <p className="mt-0.5 text-xs text-muted">Quick access to Siliguri Fresh Mart</p>
          <button
            onClick={handleInstall}
            className="mt-2.5 w-full rounded-lg bg-[#2D7D3A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#23682E] active:scale-[0.97]"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
