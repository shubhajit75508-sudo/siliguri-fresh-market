"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, ShoppingCart, ArrowLeft, Star, Flame, Truck, Clock, Shield, Leaf, MapPin, Share2, BadgeCheck, Zap, PackageCheck } from "lucide-react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { formatPrice, getWeightMultiplier, getAvailableWeights, getPriceForWeight, getOriginalPriceForWeight } from "@/lib/utils";
import { RestockNotifyButton } from "@/components/product/restock-notify-button";
import { fbq } from "@/components/analytics/meta-pixel";

export function ProductClient({ product }: { product: Product }) {
  const router = useRouter();
  const [selectedWeight, setSelectedWeight] = useState("");
  const [selectedCut, setSelectedCut] = useState("");
  const [selectedClean, setSelectedClean] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addToCart = useCartStore((s) => s.addItem);
  const { wishlist, toggleWishlist } = useUserStore();

  useEffect(() => {
    fbq("ViewContent", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: "INR",
    });
  }, [product?.id]);

  const weights = getAvailableWeights(product.price, product.category, product.weight, product.weightPrices);

  const displayWeight = selectedWeight || weights[0];
  const mult = getWeightMultiplier(displayWeight);
  const displayPrice = getPriceForWeight(product.price, displayWeight, product.weightPrices);
  const displayOriginal = getOriginalPriceForWeight(product.price, product.originalPrice, displayWeight, product.weightPrices);

  const isFlashDeal = product.isFlashDeal ?? (product.discount && product.discount > 0);
  const savings = displayOriginal && displayOriginal > displayPrice ? displayOriginal - displayPrice : 0;
  const discountPercent = product.discount || 0;

  const stockQty = product.stock == null ? 0 : product.stock;
  const available = product.inStock && stockQty > 0;

  const allImages = [product.image, ...(product.images || [])];

  const handleAdd = useCallback(() => {
    addToCart(product, qty, { weight: displayWeight, cut: selectedCut, cleaning: selectedClean });
    fbq("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: displayPrice * qty,
      currency: "INR",
      contents: [{ id: product.id, quantity: qty }],
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }, [addToCart, product, qty, displayWeight, selectedCut, selectedClean, displayPrice]);

  const handleBuyNow = useCallback(() => {
    addToCart(product, qty, { weight: displayWeight, cut: selectedCut, cleaning: selectedClean });
    router.push("/checkout");
  }, [addToCart, product, qty, displayWeight, selectedCut, selectedClean, router]);

  // Social proof count (seeded from product name)
  const nameHash = product.name.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const boughtToday = 50 + Math.abs(nameHash) % 150;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    ...(product.category ? [{ name: product.category.charAt(0).toUpperCase() + product.category.slice(1), url: "/category/" + product.category }] : []),
    { name: product.name, url: "/product/" + product.slug },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: "https://www.siligurifreshmart.com" + item.url,
    })),
  };

  // Shared CTA used by both the in-page button and the mobile sticky bar
  const ctaButton = (
    <button
      onClick={handleAdd}
      aria-label="Add to cart"
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2E9B3F] to-[#23682E] px-5 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-[#2D7D3A]/30 transition-all hover:shadow-xl hover:shadow-[#2D7D3A]/40 hover:brightness-105 active:scale-[0.97]"
    >
      {justAdded ? <PackageCheck className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
      {justAdded ? "Added ✓" : "Add to Cart"}
    </button>
  );

  return (
    <div className="pb-44 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb + actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted">
          <button onClick={() => router.back()} className="mr-1 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-2 hover:text-foreground transition-colors" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={() => router.push("/")} className="hover:text-foreground transition-colors">Home</button>
          <span className="mx-1">/</span>
          {product.category && (
            <><button onClick={() => router.push(`/category/${product.category}`)} className="hover:text-foreground transition-colors capitalize">{product.category}</button>
            <span className="mx-1">/</span></>
          )}
          <span className="text-foreground truncate max-w-[120px]">{product.name}</span>
        </div>
        <button
          onClick={() => { if (navigator.share) navigator.share({ title: product.name, url: window.location.href }); }}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      {/* Offer strip */}
      <div className="mb-5 -mx-1 flex items-center gap-2 overflow-x-auto rounded-2xl border border-[#F5A623]/25 bg-gradient-to-r from-[#FFF6E5] to-[#FFF0D1] px-4 py-2.5 no-scrollbar sm:mx-0">
        <Zap className="h-4 w-4 shrink-0 text-[#B8790A]" fill="currentColor" />
        <p className="whitespace-nowrap text-[11px] font-bold text-[#8A5C06]">
          {savings > 0 ? `Save ${formatPrice(savings)} today on ${displayWeight}` : "Market-fresh price — sourced this morning"}
        </p>
        <span className="mx-1 h-3 w-px shrink-0 bg-[#E8C98A]" />
        <p className="whitespace-nowrap text-[11px] font-semibold text-[#A06A0B]"><Truck className="mr-1 inline h-3 w-3" />Free delivery above ₹299</p>
        <span className="mx-1 h-3 w-px shrink-0 bg-[#E8C98A]" />
        <p className="whitespace-nowrap text-[11px] font-semibold text-[#A06A0B]"><Shield className="mr-1 inline h-3 w-3" />Freshness guaranteed</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10 lg:gap-14">
        {/* Image + Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="group relative aspect-square overflow-hidden rounded-[28px] bg-gradient-to-br from-white/60 via-surface to-surface-2 ring-1 ring-border/60">
            <Image
              src={allImages[selectedImage]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
              className="transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {isFlashDeal && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-red to-[#FF4D4D] px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
                <Flame className="h-3 w-3" /> {discountPercent}% OFF
              </span>
            )}
            {product.freshnessScore > 0 && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white">
                <Leaf className="h-3 w-3" /> {product.freshnessScore}% Fresh
              </span>
            )}
            {/* bottom pill strip */}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 backdrop-blur-md ring-1 ring-black/5">
              <span className="text-[10px] font-bold text-foreground"><Truck className="mr-1 inline h-3 w-3 text-brand-fresh" />Delivered today by 4 PM</span>
              <span className="text-[10px] font-bold text-brand-fresh"><BadgeCheck className="mr-1 inline h-3 w-3" />Market Fresh</span>
            </div>
          </div>
          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? "border-[#2D7D3A] ring-1 ring-[#2D7D3A]/30 shadow-md" : "border-border opacity-60 hover:opacity-90"
                  }`}
                >
                  <Image src={img} alt={product.name + " - Image " + (i + 1)} width={64} height={64} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Category + Freshness */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-fit items-center rounded-full bg-brand-fresh/10 px-3 text-[11px] font-semibold capitalize text-brand-fresh">
              {product.category}
            </span>
            {product.freshnessScore > 0 && (
              <span className="inline-flex h-7 w-fit items-center gap-1 rounded-full bg-brand-fresh/10 px-3 text-[11px] font-semibold text-brand-fresh">
                <Leaf className="h-3 w-3" /> {product.freshnessScore}% Fresh
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[26px] font-extrabold leading-tight text-foreground sm:text-[30px]">{product.name}</h1>

          {/* Ratings + Social Proof */}
          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-foreground">
              <span className="flex items-center gap-0.5 rounded-md bg-brand-fresh px-1.5 py-0.5 text-xs font-bold text-white">
                <Star className="h-3 w-3 fill-current" /> {product.rating?.toFixed(1) || "4.5"}
              </span>
              <span className="ml-1 text-xs text-muted underline decoration-dotted underline-offset-2">{product.reviewCount || 0} ratings</span>
            </span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs font-semibold text-brand-fresh">
              🔥 {boughtToday}+ bought today
            </span>
          </div>

          {/* Stock + Delivery Row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {available ? (
              <span className="inline-flex items-center gap-1 text-xs text-brand-fresh font-semibold">
                <span className="live-dot h-2 w-2 rounded-full bg-brand-fresh" /> In Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-brand-red font-semibold">
                <span className="h-2 w-2 rounded-full bg-brand-red" /> Out of Stock
              </span>
            )}
            <span className="text-xs text-muted">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock className="h-3 w-3" /> Delivers in {product.deliveryEta || 45}-60 min
            </span>
            <span className="text-xs text-muted">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-brand-fresh font-semibold">
              <Truck className="h-3 w-3" /> Free delivery above ₹299
            </span>
          </div>

          {/* Source / Product Info */}
          {(product.species || product.river || product.source || product.catchDate) && (
            <div className="mt-3 rounded-xl bg-surface-2 border border-border p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                {product.species && <span><span className="text-foreground font-semibold">Species:</span> {product.species}</span>}
                {product.river && <span><span className="text-foreground font-semibold">River:</span> {product.river}</span>}
                {product.source && <span><span className="text-foreground font-semibold">Source:</span> {product.source}</span>}
                {product.catchDate && <span><span className="text-foreground font-semibold">Catch Date:</span> {product.catchDate}</span>}
              </div>
            </div>
          )}

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>
          )}

          {/* ── BUY ZONE ── */}
          <div className="mt-5 rounded-2xl border border-border bg-gradient-to-b from-white to-surface p-4 sm:p-5">
            {/* Price + Savings */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[30px] font-extrabold tracking-tight text-foreground">{formatPrice(displayPrice)}</span>
              {displayOriginal && displayOriginal > displayPrice && (
                <span className="text-base text-muted-light line-through">{formatPrice(displayOriginal)}</span>
              )}
              {isFlashDeal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 border border-brand-red/20 px-2.5 py-0.5 text-[11px] font-bold text-brand-red">
                  -{discountPercent}%
                </span>
              )}
            </div>
            {savings > 0 ? (
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-fresh/10 border border-brand-fresh/20 px-2.5 py-0.5 text-[11px] font-bold text-brand-fresh">
                  <BadgeCheck className="h-3 w-3" /> Verified Seller
                </span>
                <span className="text-xs font-semibold text-brand-fresh">You save {formatPrice(savings)} ({discountPercent}% off)</span>
              </div>
            ) : (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-fresh/10 border border-brand-fresh/20 px-2.5 py-0.5 text-[11px] font-bold text-brand-fresh">
                <BadgeCheck className="h-3 w-3" /> Verified Seller
              </span>
            )}
            {displayWeight !== weights[0] && (
              <p className="mt-1.5 text-xs text-muted">{formatPrice(getPriceForWeight(product.price, weights[0], product.weightPrices))} / {weights[0]}</p>
            )}

            {/* Weight selector */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Select Weight</p>
              <div className="flex flex-wrap gap-2">
                {weights.map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeight(w)}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                      displayWeight === w
                        ? "border-[#2D7D3A] bg-[#2D7D3A]/10 text-[#2D7D3A] shadow-sm"
                        : "border-border text-muted hover:border-[#2D7D3A]/40 hover:bg-[#2D7D3A]/5"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Cut Options */}
            {product.cuts && product.cuts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Cut Preference</p>
                <div className="flex flex-wrap gap-2">
                  {product.cuts.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCut(c === selectedCut ? "" : c)}
                      className={`rounded-xl border-2 px-4 py-2 text-xs font-semibold transition-all ${
                        selectedCut === c
                          ? "border-brand-fresh bg-brand-fresh/10 text-brand-fresh shadow-sm"
                          : "border-white/10 text-muted hover:border-brand-fresh/40 hover:bg-brand-fresh/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cleaning Options */}
            {product.cleaningOptions && product.cleaningOptions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Cleaning</p>
                <div className="flex flex-wrap gap-2">
                  {product.cleaningOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedClean(c === selectedClean ? "" : c)}
                      className={`rounded-xl border-2 px-4 py-2 text-xs font-semibold transition-all ${
                        selectedClean === c
                          ? "border-brand-fresh bg-brand-fresh/10 text-brand-fresh shadow-sm"
                          : "border-white/10 text-muted hover:border-brand-fresh/40 hover:bg-brand-fresh/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to cart (desktop) */}
            <div className="mt-5 flex items-center gap-3">
              {available && (
                <div className="flex h-[52px] shrink-0 items-center rounded-xl border border-border bg-surface-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-full w-10 items-center justify-center text-lg font-bold text-muted hover:text-foreground" aria-label="Decrease quantity">−</button>
                  <span className="w-7 text-center text-sm font-bold tabular-nums text-foreground">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="flex h-full w-10 items-center justify-center text-lg font-bold text-muted hover:text-foreground" aria-label="Increase quantity">+</button>
                </div>
              )}
              {available ? (
                <>
                  {ctaButton}
                  <button
                    onClick={handleBuyNow}
                    className="hidden sm:flex h-[52px] shrink-0 items-center justify-center rounded-xl border-2 border-[#F5A623] bg-[#FFF6E5] px-5 text-sm font-extrabold uppercase tracking-wide text-[#8A5C06] transition-all hover:bg-[#FFEDC6] active:scale-[0.97]"
                  >
                    Buy Now
                  </button>
                </>
              ) : (
                <RestockNotifyButton productId={product.id} productName={product.name} size="lg" variant="icon" />
              )}

              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Add to wishlist"
                className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
                  wishlist.includes(product.id)
                    ? "border-brand-red bg-brand-red/10 text-brand-red"
                    : "border-border text-muted hover:border-brand-red/40 hover:text-brand-red"
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Delivery timeline */}
          {available && (
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface-2 p-3 text-center">
              {[
                { t: "Order", d: "Before 4 PM" },
                { t: "Packed", d: product.deliveryEta ? `${product.deliveryEta}-60 min` : "45-60 min" },
                { t: "At your door", d: "Same day" },
              ].map((s, i) => (
                <div key={s.t} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px flex-1 bg-brand-fresh/30" />}
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-fresh">{s.t}</p>
                    <p className="text-[11px] font-semibold text-foreground mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Benefits */}
          <div className="mt-6 grid grid-cols-1 gap-2.5">
            {[
              { icon: Star, text: `Freshness guaranteed — ${product.freshnessScore || 95}% score` },
              { icon: Shield, text: "Replacement guaranteed — request within 3 hours" },
              { icon: Truck, text: "Free delivery above ₹299 · No hidden charges" },
              { icon: MapPin, text: `Sourced from ${product.source || "local markets"}` },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2/50 px-3.5 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-fresh/10">
                  <Icon className="h-3.5 w-3.5 text-brand-fresh" />
                </span>
                <span className="text-[13px] font-medium text-muted">{text}</span>
              </div>
            ))}
          </div>

          {/* Nutrition Info */}
          {product.nutrition && Object.keys(product.nutrition).length > 0 && (
            <div className="mt-5 rounded-xl bg-surface-2 border border-border p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Nutrition Facts</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(product.nutrition).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-surface-2 px-3 py-1.5 text-center">
                    <p className="text-[10px] text-muted uppercase tracking-wide">{key}</p>
                    <p className="text-xs font-bold text-foreground mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-5 flex items-center justify-center gap-4 pt-3 border-t border-border">
            <span className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1"><Shield className="h-3 w-3" /> Secure Checkout</span>
            <span className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1"><Leaf className="h-3 w-3" /> 100% Fresh</span>
            <span className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1"><Truck className="h-3 w-3" /> Free Delivery Above ₹299</span>
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile Buy Bar (Flipkart style) ── */}
      {available && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 lg:hidden">
          <div className="mx-3 mb-1 rounded-2xl border border-border bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(16,45,20,0.18)] overflow-hidden">
            <div className="flex items-center gap-3 p-2.5">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-border">
                <Image src={allImages[0]} alt={product.name} width={48} height={48} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-extrabold tabular-nums text-foreground">{formatPrice(displayPrice)}</span>
                  {displayOriginal && displayOriginal > displayPrice && (
                    <span className="text-[11px] text-muted-light line-through">{formatPrice(displayOriginal)}</span>
                  )}
                </div>
                <p className="truncate text-[10px] font-semibold text-muted">
                  {displayWeight}{selectedCut ? ` · ${selectedCut}` : ""}{selectedClean ? ` · ${selectedClean}` : ""}
                </p>
                {savings > 0 && <p className="text-[10px] font-bold text-brand-fresh">Save {formatPrice(savings)}</p>}
              </div>
              {ctaButton}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}