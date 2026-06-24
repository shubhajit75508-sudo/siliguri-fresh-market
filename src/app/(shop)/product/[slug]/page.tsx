"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Heart, ShoppingCart, ArrowLeft, Star, Flame, Truck, Clock, Shield, Leaf, MapPin, Navigation } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { formatPrice, getWeightMultiplier, getAvailableWeights, getPriceForWeight, getOriginalPriceForWeight } from "@/lib/utils";
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
  const displayOriginal = getOriginalPriceForWeight(product.price, product.originalPrice, displayWeight, product.weightPrices);

  const isFlashDeal = product.discount && product.discount > 0;
  const savings = displayOriginal && displayOriginal > displayPrice ? displayOriginal - displayPrice : 0;
  const discountPercent = product.discount || 0;

  // Social proof count (seeded from product name)
  const nameHash = product.name.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const boughtToday = 50 + Math.abs(nameHash) % 150;

  return (
    <div className="py-4">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-[#80949b] transition-colors hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-[24px] bg-white/5">
          <img src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover product-img"
          />
          {isFlashDeal && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#e74c3c] px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
              <Flame className="h-3 w-3" /> -{product.discount}%
            </span>
          )}
          {product.freshnessScore > 0 && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white">
              <Leaf className="h-3 w-3 text-[#2ecc71]" /> {product.freshnessScore}% Fresh
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Category + Freshness */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-fit items-center rounded-full bg-[#2ecc71]/10 px-3 text-[11px] font-semibold capitalize text-[#2ecc71]">
              {product.category}
            </span>
            {product.freshnessScore > 0 && (
              <span className="inline-flex h-7 w-fit items-center gap-1 rounded-full bg-[#2ecc71]/10 px-3 text-[11px] font-semibold text-[#2ecc71]">
                <Leaf className="h-3 w-3" /> {product.freshnessScore}% Fresh
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[26px] font-extrabold leading-tight text-white">{product.name}</h1>

          {/* Reviews + Social Proof */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-white">
              <span className="flex items-center gap-0.5 rounded-full bg-[#2ecc71]/15 px-2 py-0.5 text-xs font-bold text-[#2ecc71]">
                <Star className="h-3 w-3 fill-current" /> {product.rating?.toFixed(1) || "4.5"}
              </span>
            </span>
            <span className="text-xs text-[#80949b]">
              {product.reviewCount || 0} reviews
            </span>
            <span className="text-xs text-[#80949b]">·</span>
            <span className="text-xs text-[#2ecc71] font-semibold">
              🔥 {boughtToday}+ bought today
            </span>
          </div>

          {/* Stock + Delivery Row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-[#2ecc71] font-semibold">
              <span className="live-dot h-2 w-2 rounded-full bg-[#2ecc71]" /> In Stock
            </span>
            <span className="text-xs text-[#80949b]">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-[#80949b]">
              <Clock className="h-3 w-3" /> Delivers in {product.deliveryEta || 30}-45 min
            </span>
            <span className="text-xs text-[#80949b]">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-[#2ecc71] font-semibold">
              <Truck className="h-3 w-3" /> Free over ₹299
            </span>
          </div>

          {/* Source / Product Info */}
          {(product.species || product.river || product.source || product.catchDate) && (
            <div className="mt-3 rounded-xl bg-white/5 border border-white/5 p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#80949b]">
                {product.species && <span><span className="text-white font-semibold">Species:</span> {product.species}</span>}
                {product.river && <span><span className="text-white font-semibold">River:</span> {product.river}</span>}
                {product.source && <span><span className="text-white font-semibold">Source:</span> {product.source}</span>}
                {product.catchDate && <span><span className="text-white font-semibold">Catch Date:</span> {product.catchDate}</span>}
              </div>
            </div>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-[#80949b]">{product.description}</p>
          )}

          {/* Weight selector */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#80949b]">Select Weight</p>
            <div className="flex flex-wrap gap-2">
              {weights.map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeight(w)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    displayWeight === w
                      ? "border-[#2ecc71] bg-[#2ecc71]/10 text-[#2ecc71] shadow-sm"
                      : "border-white/10 text-[#80949b] hover:border-[#2ecc71]/40"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Price + Savings */}
          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-bold text-white">{formatPrice(displayPrice)}</span>
              {displayOriginal && displayOriginal > displayPrice && (
                <span className="text-base text-[#5a7278] line-through">{formatPrice(displayOriginal)}</span>
              )}
              {isFlashDeal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e74c3c]/10 border border-[#e74c3c]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#e74c3c]">
                  -{discountPercent}%
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="mt-1 text-xs text-[#2ecc71] font-semibold">
                You save {formatPrice(savings)} ({discountPercent}% off)
              </p>
            )}
            {displayWeight !== weights[0] && (
              <p className="mt-1 text-xs text-[#80949b]">{formatPrice(getPriceForWeight(product.price, weights[0], product.weightPrices))} / {weights[0]}</p>
            )}
          </div>

          {/* Add to cart */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => {
                addToCart(product, 1, { weight: displayWeight });
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2ecc71] px-6 py-3.5 font-bold text-[#0a1f1c] shadow-lg shadow-[#2ecc71]/25 transition-all hover:bg-[#27ae60] active:scale-[0.98]"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl border-2 transition-all ${
                wishlist.includes(product.id)
                  ? "border-[#e74c3c] bg-[#e74c3c]/10 text-[#e74c3c]"
                  : "border-white/10 text-[#80949b] hover:border-[#e74c3c]/40 hover:text-[#e74c3c]"
              }`}
            >
              <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-3 border-t border-white/5 pt-5">
            {[
              { icon: Star, text: `Freshness guaranteed — ${product.freshnessScore || 95}% score` },
              { icon: Shield, text: "30-min delivery — first batch" },
              { icon: Truck, text: "Free delivery over ₹299" },
              { icon: MapPin, text: `Sourced from ${product.source || "local markets"}` },
              { icon: Navigation, text: "Replacement guaranteed — request within 3 hours" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2ecc71]/10">
                  <Icon className="h-3 w-3 text-[#2ecc71]" />
                </span>
                <span className="text-sm text-[#80949b]">{text}</span>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-5 flex items-center justify-center gap-4 pt-3 border-t border-white/5">
            <span className="text-[10px] font-semibold text-[#80949b] tracking-wider flex items-center gap-1"><Shield className="h-3 w-3" /> Secure Checkout</span>
            <span className="text-[10px] font-semibold text-[#80949b] tracking-wider flex items-center gap-1"><Leaf className="h-3 w-3" /> 100% Fresh</span>
            <span className="text-[10px] font-semibold text-[#80949b] tracking-wider flex items-center gap-1"><Truck className="h-3 w-3" /> Free Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
