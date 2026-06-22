"use client";

import { use, useState } from "react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { Heart, ShoppingCart, ArrowLeft, Star, Flame } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { formatPrice, getWeightMultiplier, getAvailableWeights, getPriceForWeight } from "@/lib/utils";
import { useProductBySlug } from "@/lib/hooks/use-products";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProductBySlug(slug);
  const [selectedWeight, setSelectedWeight] = useState("");
  const addToCart = useCartStore((s) => s.addItem);
  const { wishlist, toggleWishlist } = useUserStore();

  if (isLoading) return <div className="py-6 space-y-4"><div className="skeleton h-80 w-full rounded-[24px]" /><div className="skeleton h-6 w-48 rounded-xl" /><div className="skeleton h-4 w-96 rounded-xl" /><div className="skeleton h-12 w-64 rounded-xl" /></div>;
  if (!product) notFound();

  const weights = getAvailableWeights(product.price, product.category, product.weight, product.weightPrices);

  const displayWeight = selectedWeight || weights[0];
  const mult = getWeightMultiplier(displayWeight);
  const displayPrice = getPriceForWeight(product.price, displayWeight, product.weightPrices);

  const isFlashDeal = product.discount && product.discount > 0;

  return (
    <div className="py-4">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-[24px] bg-surface">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover product-img"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
          {isFlashDeal && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-red px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
              <Flame className="h-3 w-3" /> -{product.discount}%
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="inline-flex h-7 w-fit items-center rounded-full bg-brand-fresh/10 px-3 text-[11px] font-semibold capitalize text-brand-fresh-dim">
            {product.category}
          </span>
          <h1 className="mt-3 text-[26px] font-extrabold leading-tight">{product.name}</h1>

          {product.origin && (
            <p className="mt-1 text-sm text-muted">Origin: {product.origin}</p>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>
          )}

          {/* Weight selector */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Select Weight</p>
            <div className="flex flex-wrap gap-2">
              {weights.map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeight(w)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    displayWeight === w
                      ? "border-brand-fresh bg-brand-fresh/10 text-brand-fresh-dim shadow-sm"
                      : "border-border text-muted hover:border-brand-fresh/40"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-[28px] font-bold">{formatPrice(displayPrice)}</span>
            <span className="text-sm text-muted">{displayWeight === weights[0] ? "" : `(${formatPrice(product.price * getWeightMultiplier(weights[0]))} / ${weights[0]})`}</span>
          </div>

          {/* Add to cart */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => {
                addToCart(product, 1, { weight: displayWeight });
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-fresh px-6 py-3.5 font-bold text-white shadow-lg shadow-brand-fresh/25 transition-all hover:bg-brand-fresh-dim active:scale-[0.98]"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl border-2 transition-all ${
                wishlist.includes(product.id)
                  ? "border-brand-red bg-brand-red/10 text-brand-red"
                  : "border-border text-muted hover:border-brand-red/40 hover:text-brand-red"
              }`}
            >
              <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Benefits */}
          <div className="mt-8 space-y-3 border-t border-border pt-6">
            {[
              "Fresh from local farms & waters",
              "Cleaned and cut to your preference",
              "Free delivery within Siliguri",
              "30-minute delivery — first batch",
              "Replacement guaranteed — call to request",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-fresh/10">
                  <Star className="h-3 w-3 text-brand-fresh-dim" />
                </span>
                <span className="text-sm text-muted">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
