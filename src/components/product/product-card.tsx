"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Plus, Minus, Star, TrendingDown } from "lucide-react";
import { cartLineKey, useCartStore } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { useToast } from "@/components/ui/toaster";
import { RestockNotifyButton } from "@/components/product/restock-notify-button";
import { formatPrice, getAvailableWeights, getPriceForWeight, getOriginalPriceForWeight, cn } from "@/lib/utils";
import { fbq } from "@/components/analytics/meta-pixel";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "horizontal";
  badge?: string;
}

const catBadge = (cat: string): { label: string; cls: string } | null => {
  if (["fish", "chicken", "mutton", "pork", "seafood"].includes(cat)) return { label: "FRESH", cls: "fresh" };
  if (["fruits", "vegetables"].includes(cat)) return { label: "ORGANIC", cls: "organic" };
  if (["dairy", "eggs"].includes(cat)) return { label: "FARM", cls: "farm" };
  return null;
};

export function ProductCard({ product, variant = "default", badge }: ProductCardProps) {
  const { addItem, items, updateQuantity, getProductQuantity } = useCartStore();
  const toast = useToast();
  const cartQuantity = getProductQuantity(product.id);

  const weights = getAvailableWeights(product.price, product.category, product.weight, product.weightPrices);
  const [selectedWeight, setSelectedWeight] = useState(weights[0]);
  const displayPrice = getPriceForWeight(product.price, selectedWeight, product.weightPrices);
  const displayOriginal = getOriginalPriceForWeight(product.price, product.originalPrice, selectedWeight, product.weightPrices);

  const b = catBadge(product.category);
  const stockQty = product.stock == null ? 0 : product.stock;
  const available = product.inStock && stockQty > 0;

  const { watchedPrices, updateWatchedPrice } = useUserStore();
  const priceDropped = useRef(false);
  useEffect(() => {
    const lastPrice = watchedPrices[product.id];
    if (lastPrice !== undefined && displayPrice < lastPrice) {
      priceDropped.current = true;
    }
    updateWatchedPrice(product.id, displayPrice);
    const timer = setTimeout(() => { priceDropped.current = false; }, 5000);
    return () => clearTimeout(timer);
  }, [product.id, displayPrice]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!available) {
      toast.add(`${product.name} is out of stock`, "error");
      return;
    }
    addItem(product, 1, { weight: selectedWeight });
    fbq("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: displayPrice,
      currency: "INR",
      contents: [{ id: product.id, quantity: 1 }],
    });
    toast.add(`${product.name} added to cart`);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find((i) => i.product.id === product.id);
    if (item) {
      updateQuantity(cartLineKey(item), item.quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = items.find((i) => i.product.id === product.id);
    if (item) {
      updateQuantity(cartLineKey(item), item.quantity + 1);
    } else {
      handleAdd(e);
    }
  };

  const tag =
    badge ||
    (product.isFlashDeal
      ? "Flash Deal"
      : product.isTrending
        ? "Today's Pick"
        : null);

  const discountPct =
    displayOriginal && displayOriginal > displayPrice
      ? Math.round((1 - displayPrice / displayOriginal) * 100)
      : 0;

  if (variant === "horizontal") {
    return (
      <div className="product-card flex gap-3 p-3">
        <Link href={`/product/${product.slug}`} className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-white/5">
          <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover product-img" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <Link href={`/product/${product.slug}`} className="block min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="line-clamp-1 text-[13px] font-bold text-foreground">{product.name}</p>
              {b && <span className={`product-badge ${b.cls}`}>{b.label}</span>}
            </div>
            <p className="text-[11px] text-muted">{product.weight?.[0] || `1 ${product.unit}`}</p>
          </Link>
          {available ? (
            <button
              onClick={handleAdd}
              className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-[#2D7D3A]/30 bg-[#F2FAF2] text-[12px] font-bold text-[#23682E] transition-all hover:bg-[#E8F5E9] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          ) : (
            <RestockNotifyButton productId={product.id} productName={product.name} variant="icon" className="mt-2 h-8 w-full rounded-lg" />
          )}
        </div>
      </div>
    );
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <motion.article
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E7EFE9] bg-white shadow-[0_1px_3px_rgba(16,45,20,0.06)] transition-all duration-200 hover:border-[#A5D6A7] hover:shadow-[0_6px_20px_rgba(16,45,20,0.12)]"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[#F7FAF8]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover product-img"
          />

          {tag && (
            <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#23682E] shadow-sm backdrop-blur-sm">
              {tag}
            </span>
          )}
          {priceDropped.current && (
            <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-md bg-brand-fresh px-2 py-0.5 text-[9px] font-bold text-white shadow-md shadow-brand-fresh/30">
              <TrendingDown className="h-2.5 w-2.5" /> Price Dropped
            </span>
          )}
          {discountPct > 0 && !priceDropped.current && (
            <span className="absolute right-2 bottom-2 rounded-md bg-[#E53935] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              {discountPct}% OFF
            </span>
          )}
          {b && (
            <span className="absolute left-2 bottom-2 rounded-md bg-white/85 px-2 py-0.5 text-[9px] font-bold text-[#23682E] shadow-sm backdrop-blur-sm">
              {b.label}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <div className="mb-1 flex items-center gap-1 text-[10px] text-muted">
            <Clock className="h-2.5 w-2.5" />
            <span>{product.deliveryEta} min</span>
            <span className="ml-auto flex items-center gap-0.5 text-[10px]">
              <Star className="h-3 w-3 text-[#F5A623] fill-[#F5A623]" />
              <span className="font-semibold text-foreground">{product.rating?.toFixed(1) || "4.5"}</span>
              <span className="text-muted-light">({product.reviewCount || "120"})</span>
            </span>
          </div>

          <h3 className="line-clamp-2 leading-snug text-[13px] font-semibold text-foreground">{product.name}</h3>

          {weights.length > 1 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {weights.map((w) => (
                <button
                  key={w}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedWeight(w); }}
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold transition-all",
                    selectedWeight === w
                      ? "border-[#2D7D3A] bg-[#2D7D3A]/10 text-[#23682E]"
                      : "border-border bg-surface-2 text-muted hover:border-muted"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted">
              {product.weight?.[0] || `1 ${product.unit}`}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[15px] font-extrabold text-[#2D7D3A]">{formatPrice(displayPrice)}</span>
            {displayOriginal && displayOriginal > displayPrice && (
              <span className="text-[11px] text-muted-light line-through">{formatPrice(displayOriginal)}</span>
            )}
          </div>

          {available && stockQty > 0 && stockQty <= 5 && (
            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#D32F2F]">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#D32F2F]" />
              Only {stockQty} left — order soon
            </p>
          )}

          <div className="mt-auto pt-2">
            {cartQuantity > 0 ? (
              <div
                className="flex h-9 items-center justify-between rounded-lg bg-gradient-to-r from-[#2D7D3A] to-[#23682E] px-1 shadow-md shadow-brand-fresh/20"
                onClick={(e) => e.preventDefault()}
              >
                <button
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-black/10"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-[13px] font-bold text-white tabular-nums">{cartQuantity}</span>
                <button
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-black/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : available ? (
              <button
                onClick={handleAdd}
                className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-[#2D7D3A]/30 bg-[#F2FAF2] text-[12px] font-bold text-[#23682E] transition-all hover:bg-[#E8F5E9] hover:border-[#2D7D3A] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add
              </button>
            ) : (
              <RestockNotifyButton productId={product.id} productName={product.name} variant="icon" />
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}