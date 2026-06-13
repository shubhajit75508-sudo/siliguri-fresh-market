"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartLineId, cartLineKey, useCartStore } from "@/store/cart-store";
import { useCouponStore } from "@/store/coupon-store";
import { formatPrice, getWeightMultiplier } from "@/lib/utils";

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="text-lg font-bold">Your Cart</h2>
                <p className="text-sm text-muted">{getItemCount()} items</p>
              </div>
              <button
                onClick={closeCart}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="mb-4 text-5xl">🛒</div>
                  <h3 className="font-semibold">Your cart is empty</h3>
                  <p className="mt-1 text-sm text-muted">Add fresh items to get started</p>
                  <Button variant="default" className="mt-6 rounded-full" asChild onClick={closeCart}>
                    <Link href="/">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const lineKey = cartLineKey(item);
                    return (
                      <div
                        key={cartLineId(lineKey)}
                        className="flex gap-3 rounded-2xl border border-border p-3"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <h4 className="text-sm font-semibold line-clamp-1">{item.product.name}</h4>
                          <p className="text-xs text-muted">
                            {item.selectedWeight || item.product.unit}
                          </p>
                          <p className="mt-auto text-sm font-bold">
                            {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeItem(lineKey)}
                            className="text-xs text-brand-red"
                          >
                            Remove
                          </button>
                          <div className="flex items-center gap-2 rounded-full bg-brand-dark px-1 py-1">
                            <button
                              onClick={() => updateQuantity(lineKey, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(lineKey, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={handleApplyCoupon}
                    className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand-fresh/40 bg-brand-fresh/5 p-3"
                  >
                    <Tag className="h-4 w-4 text-brand-fresh" />
                    <span className="text-sm font-medium">
                      {couponCode ? `Coupon ${couponCode} applied` : "Apply a coupon"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4 safe-bottom">
                <div className="mb-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-brand-fresh">
                      <span>Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">Delivery</span>
                    <span className={deliveryFee === 0 ? "font-medium text-brand-fresh" : ""}>
                      {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="w-full rounded-full"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
