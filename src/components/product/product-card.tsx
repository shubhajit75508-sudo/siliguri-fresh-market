"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Leaf, Plus, Minus } from "lucide-react";
import { cartLineKey, useCartStore } from "@/store/cart-store";
import { useToast } from "@/components/ui/toaster";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "horizontal";
  badge?: string;
}

export function ProductCard({ product, variant = "default", badge }: ProductCardProps) {
  const { addItem, items, updateQuantity, getProductQuantity } = useCartStore();
  const toast = useToast();
  const cartQuantity = getProductQuantity(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) {
      toast.add(`${product.name} is out of stock`, "error");
      return;
    }
    addItem(product);
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
        : product.category === "fruits"
          ? "Seasonal"
          : null);

  if (variant === "horizontal") {
    return (
      <div className="product-card flex gap-3 p-3">
        <Link href={`/product/${product.slug}`} className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-neutral-900">
          <Image src={product.image} alt={product.name} fill className="object-cover product-img" sizes="72px" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <Link href={`/product/${product.slug}`} className="block min-w-0">
            <p className="truncate text-[13px] font-bold">{product.name}</p>
            <p className="text-[11px] text-muted">{product.weight?.[0] || `1 ${product.unit}`}</p>
          </Link>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-full border border-brand-dark/20 text-[12px] font-semibold text-brand-dark hover:bg-brand-dark/5 disabled:cursor-not-allowed disabled:opacity-50"
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
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="product-card flex h-full flex-col"
      >
        <div className="relative aspect-[4/3] sm:aspect-[5/4] overflow-hidden bg-neutral-950">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover product-img transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width:640px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

          {tag && (
            <span className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full bg-black/50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-white backdrop-blur-md">
              {tag}
            </span>
          )}

          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1 rounded-full glass-pill px-2 py-0.5 sm:px-2.5 sm:py-1">
            <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-brand-fresh" />
            <span className="text-[9px] sm:text-[10px] font-semibold text-white">{product.freshnessScore}% fresh</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="mb-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-muted">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {product.deliveryEta} min
          </div>

          <h3 className="text-[13px] sm:text-[15px] font-bold leading-snug tracking-tight">{product.name}</h3>
          <p className="mt-0.5 text-[11px] sm:text-[12px] text-muted">
            {product.weight?.[0] || `1 ${product.unit}`}
          </p>
          <p className="mt-1 text-[12px] sm:text-[13px] font-semibold text-brand-dark">{formatPrice(product.price)}</p>

          <div className="mt-auto pt-2 sm:pt-3">
            {cartQuantity > 0 ? (
              <div
                className="flex h-9 sm:h-11 items-center justify-between rounded-full bg-brand-dark px-1 shadow-sm sm:shadow-md sm:shadow-brand-dark/20"
                onClick={(e) => e.preventDefault()}
              >
                <button
                  onClick={handleDecrement}
                  className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white hover:bg-white/15"
                >
                  <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <span className="text-[11px] sm:text-[13px] font-semibold text-white">
                  {cartQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white hover:bg-white/15"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={!product.inStock}
                className="flex h-9 sm:h-11 w-full items-center justify-center gap-1 rounded-full border-[1.5px] border-brand-dark/20 text-[11px] sm:text-[13px] font-semibold text-brand-dark transition-all hover:border-brand-dark/40 hover:bg-brand-dark/[0.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                {product.inStock ? "Add" : "Sold out"}
              </button>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
