"use client";

import { useEffect, useMemo } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useUserStore } from "@/store/user-store";
import { useOrderStore } from "@/store/order-store";
import { useAuthStore } from "@/store/auth-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import type { Product } from "@/types";

const RAIL_LIMIT = 8;

function Rail({ title, subtitle, products, className }: { title: string; subtitle?: string; products: Product[]; className?: string }) {
  return (
    <section className={`py-3 sm:py-5 ${className ?? ""}`}>
      <div className="storefront-panel p-3 sm:p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="section-header-accent h-7" />
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-extrabold leading-tight tracking-tight text-foreground sm:text-[22px]">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[12px] text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-4">
          {products.map((product) => (
            <div key={product.id} className="w-[150px] shrink-0 sm:w-[176px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Products the visitor has opened before. Read from the persisted snapshot in
 * the user store and only rendered after hydration, so the server HTML is
 * never affected. Hidden entirely when there is no history.
 */
export function RecentlyViewedRail({ excludeId, className }: { excludeId?: string; className?: string }) {
  const hydrated = useHydrated();
  const items = useUserStore((s) => s.recentlyViewedProducts);
  const products = useMemo(
    () => items.filter((p) => p.id !== excludeId).slice(0, RAIL_LIMIT),
    [items, excludeId]
  );

  if (!hydrated || products.length === 0) return null;
  return <Rail title="Recently viewed" subtitle="Pick up where you left off" products={products} className={className} />;
}

/**
 * Unique products from the visitor's past orders, newest first. Only shows once
 * orders are already in the store, unless `autoLoad` is set for logged-in users.
 */
export function BuyAgainRail({ autoLoad, className }: { autoLoad?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const orders = useOrderStore((s) => s.orders);
  const loaded = useOrderStore((s) => s.loaded);
  const loadUserOrders = useOrderStore((s) => s.loadUserOrders);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    if (autoLoad && hydrated && currentUser && !loaded) loadUserOrders();
  }, [autoLoad, hydrated, currentUser, loaded, loadUserOrders]);

  const products = useMemo(() => {
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const product = item.product;
        if (!product?.id || seen.has(product.id)) continue;
        seen.add(product.id);
        out.push(product);
        if (out.length >= RAIL_LIMIT) return out;
      }
    }
    return out;
  }, [orders]);

  if (!hydrated || products.length === 0) return null;
  return <Rail title="Buy again" subtitle="Your usuals, one tap away" products={products} className={className} />;
}
