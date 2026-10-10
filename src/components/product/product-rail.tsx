"use client";

import { useEffect, useMemo } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useUserStore } from "@/store/user-store";
import { useOrderStore } from "@/store/order-store";
import { useAuthStore } from "@/store/auth-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useProducts } from "@/lib/hooks/use-products";
import type { Product } from "@/types";

const RAIL_LIMIT = 8;

/**
 * Order rows in the DB only snapshot `{ id, name, price, image, weightPrices }`
 * for each line, which is not enough for ProductCard (it drives the product
 * link from `slug`). When a full catalog match exists we use it; otherwise we
 * fill the missing fields with safe defaults so a removed product still renders
 * a card pointing nowhere broken instead of `/product/undefined`.
 */
function safeProduct(p: Partial<Product> & { id?: string }): Product {
  const id = p.id ?? "";
  return {
    id,
    slug: p.slug ?? id,
    name: p.name ?? "Item",
    description: p.description ?? "",
    category: p.category ?? "grocery",
    price: Number(p.price) || 0,
    originalPrice: p.originalPrice,
    image: p.image ?? "",
    images: p.images,
    unit: p.unit ?? "kg",
    weight: p.weight,
    weightPrices: p.weightPrices,
    cuts: p.cuts,
    freshnessScore: p.freshnessScore ?? 100,
    deliveryEta: p.deliveryEta ?? 30,
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 120,
    inStock: p.inStock ?? true,
    stock: p.stock ?? 0,
    isFlashDeal: p.isFlashDeal,
    isTrending: p.isTrending,
    tags: p.tags,
    nutrition: p.nutrition,
    source: p.source,
    origin: p.origin,
    catchDate: p.catchDate,
    river: p.river,
    species: p.species,
    cleaningOptions: p.cleaningOptions,
    discount: p.discount,
    subcategory: p.subcategory,
    buyingPrices: p.buyingPrices,
  };
}

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
  const { data: catalog = [], isSuccess: catalogLoaded } = useProducts();

  useEffect(() => {
    if (autoLoad && hydrated && currentUser && !loaded) loadUserOrders();
  }, [autoLoad, hydrated, currentUser, loaded, loadUserOrders]);

  const products = useMemo(() => {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const partial = item?.product;
        if (!partial?.id || seen.has(partial.id)) continue;
        const full = byId.get(partial.id);
        // The catalog finished loading and this product no longer exists — drop
        // it. While the catalog is still loading, fall back to the snapshot so
        // the rail does not flash empty.
        if (!full && catalogLoaded) continue;
        seen.add(partial.id);
        out.push(full ?? safeProduct(partial));
        if (out.length >= RAIL_LIMIT) return out;
      }
    }
    return out;
  }, [orders, catalog, catalogLoaded]);

  if (!hydrated || products.length === 0) return null;
  return <Rail title="Buy again" subtitle="Your usuals, one tap away" products={products} className={className} />;
}
