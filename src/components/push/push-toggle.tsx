"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/ui/toaster";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Clean = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Clean);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const toast = useToast();
  const { currentUser } = useAuthStore();
  const [configured] = useState(() => Boolean(publicKey));
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
  );
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported || !configured || !navigator.serviceWorker) return;
    let cancelled = false;
    navigator.serviceWorker.ready.then((reg) => {
      if (cancelled) return;
      return reg.pushManager.getSubscription();
    }).then((sub) => {
      if (!cancelled && sub) setEnabled(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [supported, configured]);

  if (!supported || !configured) return null;
  if (!currentUser) return null;

  const handleToggle = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();

      if (enabled && existing) {
        await existing.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        setEnabled(false);
        toast.add("Delivery alerts turned off");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.add("Permission denied — enable notifications in browser settings", "error");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      const p256 = sub.getKey("p256dh");
      const authKey = sub.getKey("auth");
      if (!p256 || !authKey) throw new Error("missing keys");
      const toBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: toBase64(p256), auth: toBase64(authKey) },
        }),
      });

      if (!res.ok) throw new Error("save failed");
      setEnabled(true);
      toast.add("Delivery alerts enabled");
    } catch {
      toast.add("Couldn't enable push notifications", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 ${
        enabled
          ? "bg-brand-fresh/15 text-brand-fresh"
          : "border border-border text-muted hover:border-brand-fresh/40 hover:text-foreground"
      }`}
    >
      {enabled ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {enabled ? "Alerts on" : "Delivery alerts"}
    </button>
  );
}
