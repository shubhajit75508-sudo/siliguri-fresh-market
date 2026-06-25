"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CapacitorDeepLink() {
  const router = useRouter();

  useEffect(() => {
    let handle: { remove: () => void } | undefined;

    async function init() {
      try {
        const { App } = await import("@capacitor/app");
        const { Browser } = await import("@capacitor/browser");

        handle = await App.addListener("appUrlOpen", (event: { url: string }) => {
          const url = new URL(event.url);

          if (url.pathname === "/payment" || url.hostname === "payment") {
            const status = url.searchParams.get("status");
            const sfmOrderId = url.searchParams.get("sfm_order_id");

            Browser.close();

            if (status === "success" && sfmOrderId) {
              router.push("/track/" + encodeURIComponent(sfmOrderId));
            } else {
              router.push("/checkout?payment_failed=true");
            }
          }
        });
      } catch {
        // Capacitor not available (web), silently skip
      }
    }

    init();

    return () => {
      if (handle) handle.remove();
    };
  }, [router]);

  return null;
}
