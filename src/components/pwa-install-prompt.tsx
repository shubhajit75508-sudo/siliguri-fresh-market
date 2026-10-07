"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent;
  }
}

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.siligurifreshmart";
const DISMISS_KEY = "app-install-dismissed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }

    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      window.deferredInstallPrompt = prompt;
    };

    window.addEventListener("beforeinstallprompt", handler);

    const timer = window.setTimeout(() => setVisible(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.clearTimeout(timer);
      delete window.deferredInstallPrompt;
    };
  }, []);

  if (dismissed || !visible) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredPrompt(null);
    delete window.deferredInstallPrompt;
  };

  // iOS can't install a PWA from a banner — Safari has no beforeinstallprompt.
  if (isIOS && !deferredPrompt) return null;

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
          <Smartphone className="h-5 w-5 text-[#2D7D3A]" />
        </div>

        <div className="min-w-0 flex-1 pr-5">
          <p className="text-sm font-bold text-foreground">Get the Siliguri Freshmart App</p>
          <p className="mt-0.5 text-xs text-muted">Faster checkout, live order tracking &amp; exclusive app-only deals</p>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2D7D3A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#23682E] active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3zm12.5 6.2L13.7 6l-9 5.1 2.4 2.4 9-5zm3.6 2.1-2.6-1.5-2.7 2.7 2.7 2.7 2.6-1.5c.8-.5.8-1.9 0-2.4zM4.7 21.7l9-5.1-2.4-2.4-9 5.1c.3.6.9 1.1 2.4 2.4z" />
            </svg>
            Get it on Google Play
          </a>

          {deferredPrompt && (
            <button
              onClick={handlePwaInstall}
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-alt hover:text-foreground"
            >
              <Download className="h-3 w-3" /> Install on this device
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
