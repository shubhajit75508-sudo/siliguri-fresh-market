"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Tag, ArrowRight, ShoppingBag, Percent, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartLineId, cartLineKey, useCartStore } from "@/store/cart-store";
import { useCouponStore } from "@/store/coupon-store";
import { formatPrice, getWeightMultiplier } from "@/lib/utils";
import { useProducts } from "@/lib/hooks/use-products";
import { ProductCard } from "@/components/product/product-card";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getTotal,
    getDeliveryFee,
    getItemCount,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();
  const deliveryFee = getDeliveryFee();

  const { coupons } = useCouponStore();
  const { data: allProducts = [] } = useProducts();
  const suggestedProducts = allProducts.filter((p) => p.inStock).slice(0, 4);

  const handleApplyCoupon = () => {
    if (couponCode) removeCoupon();
    else {
      const activeCoupon = coupons[0];
      if (activeCoupon && subtotal >= activeCoupon.minOrder) {
        const discount = activeCoupon.type === "percentage"
          ? Math.round(subtotal * activeCoupon.discount / 100)
          : activeCoupon.discount;
        applyCoupon(activeCoupon.code, discount);
      } else {
        applyCoupon("FRESH50", 50);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-gradient-to-b from-white to-gray-50/80 shadow-2xl"
          >
            {/* Header */}
            <div className="relative border-b border-border/60 bg-white/90 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-fresh to-brand-blue text-white shadow-sm">
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">Your Cart</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-muted pl-9">
                    {getItemCount()} {getItemCount() === 1 ? "item" : "items"}
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white shadow-sm hover:bg-gray-50 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Your cart is empty</h3>
                  <p className="mt-1 text-sm text-muted">Add fresh farm items to get started</p>
                  <Button variant="default" className="mt-6 rounded-full shadow-lg" asChild onClick={closeCart}>
                    <Link href="/">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const lineKey = cartLineKey(item);
                    return (
                      <motion.div
                        key={cartLineId(lineKey)}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-start gap-2 rounded-2xl border border-border/50 bg-white p-2.5 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                        </div>
                        <div className="flex flex-1 flex-col justify-between py-0.5">
                          <div>
                            <h4 className="text-sm font-semibold leading-tight">{item.product.name}</h4>
                            <p className="mt-0.5 text-[11px] text-muted tracking-tight">
                              {item.selectedWeight || item.product.unit}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-brand-dark">
                              {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                            </p>
                            <button
                              onClick={() => removeItem(lineKey)}
                              className="text-[10px] font-medium text-gray-400 transition-all hover:text-brand-red sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="self-end shrink-0">
                          <div className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-dark/90 px-1 py-1 shadow-md">
                            <button
                              onClick={() => updateQuantity(lineKey, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/90 transition-all hover:bg-white/20"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="flex h-7 w-7 items-center justify-center text-sm font-bold text-white tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(lineKey, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/90 transition-all hover:bg-white/20"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Coupon */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApplyCoupon}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 transition-all ${
                      couponCode
                        ? "border-brand-fresh/40 bg-gradient-to-r from-brand-fresh/5 to-brand-fresh/10"
                        : "border-dashed border-gray-300 bg-white/50 hover:border-brand-fresh/40 hover:bg-brand-fresh/[0.02]"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      couponCode ? "bg-brand-fresh/10" : "bg-gray-100"
                    }`}>
                      {couponCode
                        ? <Percent className="h-4 w-4 text-brand-fresh" />
                        : <Tag className="h-4 w-4 text-gray-500" />
                      }
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${couponCode ? "text-brand-fresh-dim" : ""}`}>
                        {couponCode ? `Coupon ${couponCode} applied` : "Add a coupon code"}
                      </p>
                      <p className="text-[11px] text-muted">
                        {couponCode
                          ? `You save ${formatPrice(couponDiscount)}`
                          : "Enter code at checkout or tap to apply"
                        }
                      </p>
                    </div>
                    {couponCode && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-fresh/10">
                        <Sparkles className="h-3 w-3 text-brand-fresh" />
                      </div>
                    )}
                  </motion.button>

                  {/* Suggestions */}
                  {suggestedProducts.length > 0 && (
                    <div className="pt-2">
                      <div className="mb-2 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-muted" />
                        <span className="text-xs font-semibold text-muted">Add more items</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
                        {suggestedProducts.map((p) => (
                          <div key={p.id} className="min-w-[140px] max-w-[140px] snap-start shrink-0">
                            <div className="rounded-xl border border-border/40 bg-white overflow-hidden shadow-sm">
                              <Link href={`/product/${p.slug}`} onClick={closeCart} className="block relative aspect-square bg-gray-50">
                                <Image src={p.image} alt={p.name} fill className="object-cover" sizes="140px" />
                              </Link>
                              <div className="p-2">
                                <Link href={`/product/${p.slug}`} onClick={closeCart} className="block">
                                  <p className="text-[11px] font-semibold leading-tight line-clamp-2">{p.name}</p>
                                </Link>
                                <p className="mt-0.5 text-[10px] font-semibold text-brand-dark">{formatPrice(p.price)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/60 bg-white/90 px-5 pb-6 pt-4 backdrop-blur-xl safe-bottom">
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-fresh">Discount</span>
                      <span className="font-medium text-brand-fresh">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Delivery</span>
                    <span className={deliveryFee === 0 ? "font-medium text-brand-fresh" : "font-medium"}>
                      {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-brand-dark tabular-nums">₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <Link href="/checkout" onClick={closeCart}>
                  <Button
                    variant="default"
                    className="w-full rounded-xl py-3 text-sm font-bold shadow-lg shadow-brand-dark/20 transition-all hover:shadow-xl"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
