"use client";

import { Zap } from "lucide-react";
import { FadeIn } from "@/components/animations/motion-wrapper";
import { ProductCard } from "@/components/product/product-card";
import { useFlashDeals } from "@/lib/hooks/use-products";
import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/admin-store";

export function FlashDealsSection() {
  const { data: deals = [], isLoading, error } = useFlashDeals();
  const [apiRaw, setApiRaw] = useState<string>("loading...");
  const [adminRaw, setAdminRaw] = useState<string>("loading...");

  useEffect(() => {
    fetch("/api/products/flash-deals")
      .then((r) => r.ok ? r.json() : r.text().then((t) => { throw new Error(t); }))
      .then((d) => setApiRaw(JSON.stringify(d, null, 2)))
      .catch((e) => setApiRaw(`ERROR: ${e.message}`));
  }, []);

  useEffect(() => {
    function readStore() {
      try {
        const products = useAdminStore.getState().products;
        const summary = products.map((p) => ({ id: p.id, name: p.name, isFlashDeal: p.isFlashDeal }));
        const flash = products.filter((p) => p.isFlashDeal);
        setAdminRaw(JSON.stringify({ total: products.length, flashCount: flash.length, all: summary }, null, 2));
      } catch { setAdminRaw("store not available"); }
    }
    readStore();
    const unsub = (useAdminStore as any).persist?.onFinishHydration?.(readStore);
    return () => unsub?.();
  }, []);

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 via-brand-orange/5 to-brand-red/5" />
      <div className="relative mx-auto max-w-7xl px-4">
        <FadeIn className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
            <Zap className="h-5 w-5 text-brand-red" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Flash Deals</h2>
            <p className="text-sm text-muted">
              {isLoading ? "Loading..." : error ? `Error: ${error.message}` : `${deals.length} deals`}
            </p>
          </div>
        </FadeIn>
        {deals.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} badge="Flash Deal" />
            ))}
          </div>
        )}
        <details className="mt-4 rounded-lg border border-dashed border-amber-400/30 bg-amber-950/10 p-3 text-xs font-mono">
          <summary className="cursor-pointer text-amber-400">API raw response</summary>
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-muted">{apiRaw}</pre>
        </details>
        <details className="mt-2 rounded-lg border border-dashed border-amber-400/30 bg-amber-950/10 p-3 text-xs font-mono">
          <summary className="cursor-pointer text-amber-400">Admin store flash deals</summary>
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-muted">{adminRaw}</pre>
        </details>
      </div>
    </section>
  );
}
