"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Plus, Minus, Star } from "lucide-react";
import { cartLineKey, useCartStore } from "@/store/cart-store";
import { useToast } from "@/components/ui/toaster";
import { formatPrice, getAvailableWeights, getPriceForWeight, getOriginalPriceForWeight } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "horizontal";
  badge?: string;
}

const catBadge = (cat: string): { label: string; cls: string } | null => {
  if (["fish", "chicken", "mutton", "seafood"].includes(cat)) return { label: "FRESH", cls: "fresh" };
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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) {
      toast.add(`${product.name} is out of stock`, "error");
      return;
    }
    addItem(product, 1, { weight: selectedWeight });
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
      ? "Fresh Catch"
      : product.isTrending
        ? "Today's Pick"
        : null);

  if (variant === "horizontal") {
    return (
      <div className="product-card flex gap-3 p-3">
        <Link href={`/product/${product.slug}`} className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-white/5">
          <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover product-img" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <Link href={`/product/${product.slug}`} className="block min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13px] font-bold text-white">{product.name}</p>
              {b && <span className={`product-badge ${b.cls}`}>{b.label}</span>}
            </div>
            <p className="text-[11px] text-[#80949b]">{product.weight?.[0] || `1 ${product.unit}`}</p>
          </Link>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-full border border-white/10 text-[12px] font-semibold text-white hover:bg-white/5 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> {product.inStock ? "Add to cart" : "Out of stock"}
          </button>
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
        className="product-card flex h-full flex-col"
      >
        <div className="relative aspect-[5/4] overflow-hidden bg-white/5">
          <img src={product.image}
            alt={product.name}
            className="object-cover product-img transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {tag && (
            <span className="absolute right-3 top-3 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-white">
              {tag}
            </span>
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {b && <span className={`product-badge ${b.cls}`}>{b.label}</span>}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1.5 flex items-center gap-1 text-[11px] text-[#80949b]">
            <Clock className="h-3 w-3" />
            {product.deliveryEta} min
          </div>

          <h3 className="line-clamp-1 text-[15px] font-bold text-white">{product.name}</h3>

          {weights.length > 1 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {weights.map((w) => (
                <button
                  key={w}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedWeight(w); }}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all ${
                    selectedWeight === w
                      ? "border-[#2ecc71] bg-[#2ecc71]/10 text-[#2ecc71]"
                      : "border-white/10 bg-white/5 text-[#80949b] hover:border-white/30"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-[12px] text-[#80949b]">
              {product.weight?.[0] || `1 ${product.unit}`}
            </p>
          )}

          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#2ecc71]">{formatPrice(displayPrice)}</span>
            {displayOriginal && displayOriginal > displayPrice && (
              <span className="text-[11px] text-[#5a7278] line-through">{formatPrice(displayOriginal)}</span>
            )}
            <span className="text-[11px] text-[#80949b] ml-auto">
              <Star className="h-3 w-3 inline text-[#f1c40f] mr-0.5" />
              {product.rating?.toFixed(1) || "4.5"} ({product.reviewCount || "120"})
            </span>
          </div>

          <div className="mt-auto pt-3">
            {cartQuantity > 0 ? (
              <div
                className="flex h-11 items-center justify-between rounded-full bg-[#2ecc71] px-1.5 shadow-md shadow-[#2ecc71]/20"
                onClick={(e) => e.preventDefault()}
              >
                <button
                  onClick={handleDecrement}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[#0a1f1c] hover:bg-black/10"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-[13px] font-semibold text-[#0a1f1c]">
                  {cartQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[#0a1f1c] hover:bg-black/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={!product.inStock}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-white/10 text-[13px] font-semibold text-white transition-all hover:border-[#2ecc71]/30 hover:bg-[#2ecc71]/5 active:scale-[0.98] disabled:opacity-50"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                {product.inStock ? "Add" : "Out of stock"}
              </button>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}