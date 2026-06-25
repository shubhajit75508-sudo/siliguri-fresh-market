"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Plus, Minus, ArrowRight, Truck, Shield, ShoppingCart, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartLineId, cartLineKey, useCartStore } from "@/store/cart-store";
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
  } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();
  const deliveryFee = getDeliveryFee();

  const badge = (cat: string) => {
    if (["fish", "chicken", "mutton", "seafood"].includes(cat)) return { label: "FRESH", cls: "fresh" };
    if (["fruits", "vegetables"].includes(cat)) return { label: "ORGANIC", cls: "organic" };
    if (["dairy", "eggs"].includes(cat)) return { label: "FARM", cls: "farm" };
    return null;
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            drag="x"
            dragConstraints={{ left: 0, right: 120 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => { if (info.offset.x > 100) closeCart(); }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-gradient-to-b from-[#0d1b2a] to-[#0a1f1c] shadow-2xl border-l border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <h2 className="text-lg font-extrabold text-white"><ShoppingCart className="h-5 w-5 inline mr-1.5" />Your Cart</h2>
                <p className="text-xs text-[#80949b] mt-0.5">{getItemCount()} items</p>
              </div>
              <button
                onClick={closeCart}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition-all"
              >
                <X className="h-5 w-5 text-[#80949b]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <ShoppingCart className="h-12 w-12 mb-4 text-[#80949b]" />
                  <h3 className="text-lg font-bold text-white">Cart is empty</h3>
                  <p className="mt-1 text-sm text-[#80949b]">Add fresh items to get started</p>
                  <Link href="/" onClick={closeCart}>
                    <Button className="mt-6 rounded-full bg-[#2ecc71] hover:bg-[#27ae60] text-[#0a1f1c] font-bold px-6 py-2.5 shadow-lg shadow-[#2ecc71]/20">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const lineKey = cartLineKey(item);
                    const b = badge(item.product.category);
                    return (
                      <motion.div
                        key={cartLineId(lineKey)}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                          <img src={item.product.image}
                            alt={item.product.name}
                            className="object-cover brightness-90"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{item.product.name}</h4>
                              {b && (
                                <span className={`product-badge ${b.cls}`}>{b.label}</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-[#80949b]">
                              {item.selectedWeight || item.product.unit}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-[#2ecc71]">
                              {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                            </p>
                            <button
                              onClick={() => removeItem(lineKey)}
                              className="text-[11px] font-semibold text-[#80949b] transition-all hover:text-[#e74c3c] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {/* Quantity stepper */}
                        <div className="self-end shrink-0">
                          <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl bg-white/8 px-0.5 sm:px-1 py-0.5 sm:py-1">
                            <button
                              onClick={() => updateQuantity(lineKey, item.quantity - 1)}
                              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 transition-all"
                            >
                              <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center text-sm font-bold text-white tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(lineKey, item.quantity + 1)}
                              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/5 bg-[#0d1b2a]/95 backdrop-blur-xl px-4 pb-6 pt-4 safe-bottom">
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#80949b]">Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#80949b]">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-[#2ecc71] font-medium" : "text-white font-medium"}>
                      {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-3 text-base font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-white tabular-nums">₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <Link href="/checkout" onClick={closeCart}>
                  <button className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-[#5a7278]">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</span>
                  <span><Leaf className="h-3 w-3 inline" /> 100% Fresh</span>
                  <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Free Delivery</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}