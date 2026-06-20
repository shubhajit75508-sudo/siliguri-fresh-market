"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, CreditCard, CheckCircle, ChevronRight, Coins, Shield, Lock,
  Smartphone, Building2, Hash, Layers, Package, Copy, X, ExternalLink,
  ArrowLeft, Loader2, Wallet, Banknote, CreditCard as CardIcon, Trash2,
  Plus, Minus, Ticket, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, cartLineId, cartLineKey } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { formatPrice, getWeightMultiplier } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { ReturnPolicyBanner } from "@/components/ui/return-policy";
import type { Address } from "@/types";

const PAYMENT_UPI_ID = "shubhajit75508@okhdfcbank";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const quickAmounts = [500, 1000, 2000, 5000];

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydrated();
  const { items, getSubtotal, getTotal, getDeliveryFee, getCoinsDiscount, couponDiscount, clearCart, setCoinsDiscount, updateQuantity, removeItem } = useCartStore();
  const { addresses, user, coinsRedeemed, applyCoinsRedemption, removeCoinsRedemption, earnCoins, redeemCoins } = useUserStore();
  const { currentUser } = useAuthStore();
  const { createOrder } = useOrderStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "cod">("razorpay");
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [detailForm, setDetailForm] = useState({ area: "", landmark: "", building: "", flat: "", floor: "" });
  const [showCoins, setShowCoins] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault) || addresses[0];
  const coinBalance = user?.loyaltyPoints ?? 0;
  const maxRedeemable = Math.floor(coinBalance / 100) * 100;
  const coinsEarned = Math.floor(getTotal() / 100) * 10;
  const isAuthenticated = !!(currentUser && (currentUser.role === "customer" || currentUser.role === "admin"));
  const requiredDetailsFilled = !!(detailForm.area.trim()) && !!(detailForm.landmark.trim()) && !!(detailForm.building.trim());

  useEffect(() => {
    if (selectedAddress) {
      setDetailForm({
        area: selectedAddress.area ?? "",
        landmark: selectedAddress.landmark ?? "",
        building: selectedAddress.building ?? "",
        flat: selectedAddress.flat ?? "",
        floor: selectedAddress.floor ?? "",
      });
    }
  }, [selectedAddressId]);

  const handleToggleCoins = () => {
    if (coinsRedeemed > 0) {
      removeCoinsRedemption();
      setCoinsDiscount(0);
      toast.add("Coins removed");
    } else {
      const redeem = Math.min(maxRedeemable, 500);
      if (redeem < 100) {
        toast.add("Need at least 100 coins to redeem", "error");
        return;
      }
      const discount = (redeem / 100) * 50;
      applyCoinsRedemption(redeem);
      setCoinsDiscount(discount);
      toast.add(`${redeem} coins applied — ₹${discount} off`);
    }
  };

  const openRazorpayCheckout = async () => {
    const total = getTotal();
    setConfirmingOrder(true);

    const sfmOrderId = "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setConfirmingOrder(false);
        setShowUPIModal(true);
        return;
      }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          receipt: sfmOrderId,
          notes: {
            order_id: sfmOrderId,
            customer_name: currentUser?.name ?? "",
            customer_phone: currentUser?.phone ?? "",
            customer_email: currentUser?.email ?? "",
          },
        }),
      });
      if (!res.ok) {
        setConfirmingOrder(false);
        setShowUPIModal(true);
        return;
      }

      const order = await res.json();

      const razorpay = new (window as any).Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Siliguri Fresh Mart",
        description: `Order ${sfmOrderId}`,
        order_id: order.id,
        image: "https://siligurifreshmart.com/favicon.ico",
        theme: { color: "#16a34a" },
        prefill: {
          name: currentUser?.name,
          email: currentUser?.email,
          contact: currentUser?.phone,
          method: "upi",
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            setPaymentConfirmed(true);
            placeOrder("paid", sfmOrderId);
          } else {
            toast.add("Payment verification failed. Contact support.", "error");
            setConfirmingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setConfirmingOrder(false);
            toast.add("Payment cancelled. You can retry or choose COD.", "error");
          },
        },
      });

      razorpay.on("payment.failed", (response: { error: { code: string; description: string } }) => {
        setConfirmingOrder(false);
        toast.add(`Payment failed: ${response.error.description}`, "error");
      });

      razorpay.open();
    } catch {
      setConfirmingOrder(false);
      setShowUPIModal(true);
    }
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      toast.add("Sign up required to place orders", "error");
      return;
    }
    if (!selectedAddress) {
      toast.add("Please add a delivery address in your account first", "error");
      return;
    }
    if (!requiredDetailsFilled) {
      toast.add("Please fill Area, Landmark, and Building details", "error");
      setShowAddressForm(true);
      return;
    }

    if (selectedPayment === "razorpay") {
      openRazorpayCheckout();
      return;
    }

    placeOrder("unpaid");
  };

  const placeOrder = (paymentStatus: "paid" | "unpaid", orderId?: string) => {
    setConfirmingOrder(true);

    const total = getTotal();

    (async () => {
      const finalId = await createOrder({
        id: orderId,
        items,
        total,
        address: {
          ...selectedAddress,
          area: detailForm.area.trim() || selectedAddress.area || undefined,
          landmark: detailForm.landmark.trim() || selectedAddress.landmark || undefined,
          building: detailForm.building.trim() || selectedAddress.building || undefined,
          flat: detailForm.flat.trim() || selectedAddress.flat || undefined,
          floor: detailForm.floor.trim() || selectedAddress.floor || undefined,
        },
        paymentMethod: selectedPayment === "razorpay" ? "upi" : "cod",
        paymentStatus,
        customerName: currentUser?.name ?? "Guest",
        customerPhone: currentUser?.phone ?? "",
        customerEmail: currentUser?.email ?? "",
        userId: currentUser?.id,
      });

      if (coinsRedeemed > 0) {
        redeemCoins(coinsRedeemed);
      }
      earnCoins(total);

      clearCart();
      setPaymentConfirmed(false);
      setShowUPIModal(false);
      const earned = Math.floor(total / 100) * 10;
      toast.add(`Order placed! +${earned} coins earned. Delivery in 30 min - 1 hr.`);
      router.push(`/track/${finalId}`);
    })().catch(() => {
      setConfirmingOrder(false);
      toast.add("Failed to place order. Please try again.", "error");
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted">Add items to get started</p>
        <Button variant="fresh" className="mt-6 rounded-full" onClick={() => router.push("/")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (hydrated && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10">
          <Shield className="h-10 w-10 text-brand-red" />
        </div>
        <h2 className="text-2xl font-extrabold">Sign Up Required</h2>
        <p className="mt-2 text-sm text-muted">
          You must create an account before placing an order.
        </p>
        <div className="mt-6 space-y-3">
          <Link href="/auth/signup">
            <Button variant="default" className="w-full rounded-full">
              <Plus className="mr-2 h-4 w-4" /> Create Account
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Log In
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          <Lock className="mr-1 inline h-3 w-3" />
          Your data is encrypted and never shared
        </p>
      </div>
    );
  }

  const saveAddressDetails = () => {
    if (!selectedAddress) return;
    const updated: Address = {
      ...selectedAddress,
      area: detailForm.area.trim() || selectedAddress.area || undefined,
      landmark: detailForm.landmark.trim() || selectedAddress.landmark || undefined,
      building: detailForm.building.trim() || selectedAddress.building || undefined,
      flat: detailForm.flat.trim() || selectedAddress.flat || undefined,
      floor: detailForm.floor.trim() || selectedAddress.floor || undefined,
    };
    useUserStore.getState().updateAddress(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button onClick={() => router.push("/cart")} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Cart
          </button>
          <h1 className="text-base font-bold tracking-tight">Checkout</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-5 lg:gap-8">
          {/* Main */}
          <div className="space-y-4 lg:col-span-3">
            {/* Address */}
            <section className="rounded-2xl border border-border/60 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-fresh" />
                  <h2 className="text-sm font-bold">Delivery Address</h2>
                </div>
                {selectedAddress && (
                  <Badge variant={requiredDetailsFilled ? "fresh" : "orange"} className="text-[10px]">
                    {requiredDetailsFilled ? "Ready" : "Details needed"}
                  </Badge>
                )}
              </div>

              {!selectedAddress ? (
                <div className="p-6 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-muted" />
                  <p className="mt-2 text-sm text-muted">No saved addresses.</p>
                  <Link href="/account/addresses">
                    <Button variant="fresh" size="sm" className="mt-3 rounded-full">Add Address</Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4">
                  {addresses.length > 1 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault);
                        return (
                          <button
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                              isSelected
                                ? "border-brand-fresh bg-brand-fresh/5 ring-1 ring-brand-fresh/30"
                                : "border-border/60 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <span className="font-semibold">{addr.label}</span>
                            <span className="block text-muted">{addr.line1?.slice(0, 25)}...</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="rounded-xl bg-surface/50 p-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{selectedAddress.line1}</p>
                        <p className="text-xs text-muted">{selectedAddress.city} — {selectedAddress.pincode}</p>
                        {selectedAddress.landmark && <p className="text-xs text-muted">Near {selectedAddress.landmark}</p>}
                      </div>
                      <button
                        onClick={() => setShowAddressForm(!showAddressForm)}
                        className="shrink-0 text-xs font-semibold text-brand-fresh-dim hover:text-brand-fresh"
                      >
                        {showAddressForm ? "Done" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {showAddressForm && (
                    <div className="mt-3 space-y-2.5 border-t border-border/40 pt-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-medium text-muted">Area / Locality *</label>
                          <input value={detailForm.area} onChange={(e) => setDetailForm(f => ({ ...f, area: e.target.value }))}
                            placeholder="Salbari" className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted">Landmark *</label>
                          <input value={detailForm.landmark} onChange={(e) => setDetailForm(f => ({ ...f, landmark: e.target.value }))}
                            placeholder="Near City Centre" className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-medium text-muted">Building *</label>
                          <input value={detailForm.building} onChange={(e) => setDetailForm(f => ({ ...f, building: e.target.value }))}
                            placeholder="Green Tower" className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted">Flat</label>
                          <input value={detailForm.flat} onChange={(e) => setDetailForm(f => ({ ...f, flat: e.target.value }))}
                            placeholder="3B" className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted">Floor</label>
                          <input value={detailForm.floor} onChange={(e) => setDetailForm(f => ({ ...f, floor: e.target.value }))}
                            placeholder="2nd" className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
                        </div>
                      </div>
                      <Button variant="fresh" size="sm" className="rounded-full text-xs"
                        onClick={() => {
                          if (!detailForm.area.trim() || !detailForm.landmark.trim() || !detailForm.building.trim()) {
                            toast.add("Please fill Area, Landmark and Building", "error");
                            return;
                          }
                          saveAddressDetails();
                          setShowAddressForm(false);
                          toast.add("Delivery details saved");
                        }}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Save
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Items */}
            <section className="rounded-2xl border border-border/60 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-brand-fresh" />
                  <h2 className="text-sm font-bold">Items ({items.length})</h2>
                </div>
                <span className="text-xs text-muted">{formatPrice(getSubtotal())}</span>
              </div>
              <div className="divide-y divide-border/30">
                {items.map((item) => (
                  <div key={cartLineId(cartLineKey(item))} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-fresh/10 to-brand-blue/10 text-xs font-bold text-brand-fresh-dim">
                      {item.quantity}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted">{item.selectedWeight || item.product.unit}</p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Coins */}
            {coinBalance >= 100 && (
              <section className="rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/[0.03] to-white shadow-sm">
                <button onClick={() => setShowCoins(!showCoins)} className="flex w-full items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-brand-orange" />
                    <span className="text-sm font-bold">Loyalty Coins</span>
                    <span className="text-xs text-muted">{coinBalance.toLocaleString()} available</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted transition-transform ${showCoins ? "rotate-90" : ""}`} />
                </button>
                {showCoins && (
                  <div className="border-t border-brand-orange/10 px-4 pb-4 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted">
                          {coinsRedeemed > 0
                            ? `${coinsRedeemed} coins — saves ${formatPrice(getCoinsDiscount())}`
                            : `Redeem up to ${formatPrice(Math.min(maxRedeemable, 500) / 100 * 50)}`}
                        </p>
                      </div>
                      <button
                        onClick={handleToggleCoins}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                          coinsRedeemed > 0
                            ? "bg-brand-red/10 text-brand-red"
                            : "bg-brand-fresh/10 text-brand-fresh-dim hover:bg-brand-fresh/20"
                        }`}
                      >
                        {coinsRedeemed > 0 ? "Remove" : "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar - Payment + Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 space-y-4">
              {/* Payment */}
              <section className="rounded-2xl border border-border/60 bg-white shadow-sm">
                <div className="border-b border-border/40 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-brand-fresh" />
                    <h2 className="text-sm font-bold">Payment</h2>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => setSelectedPayment("razorpay")}
                    className={`relative flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                      selectedPayment === "razorpay"
                        ? "border-brand-fresh bg-brand-fresh/[0.04] ring-1 ring-brand-fresh/30"
                        : "border-border/60 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selectedPayment === "razorpay" ? "bg-brand-fresh/10 text-brand-fresh-dim" : "bg-surface text-muted"
                    }`}>
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Razorpay</p>
                      <p className="text-xs text-muted">UPI, Card, NetBanking, Wallet</p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selectedPayment === "razorpay" ? "border-brand-fresh bg-brand-fresh" : "border-gray-300"
                    }`}>
                      {selectedPayment === "razorpay" && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPayment("cod")}
                    className={`relative flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                      selectedPayment === "cod"
                        ? "border-brand-fresh bg-brand-fresh/[0.04] ring-1 ring-brand-fresh/30"
                        : "border-border/60 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selectedPayment === "cod" ? "bg-brand-fresh/10 text-brand-fresh-dim" : "bg-surface text-muted"
                    }`}>
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Cash on Delivery</p>
                      <p className="text-xs text-muted">Pay when you receive</p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selectedPayment === "cod" ? "border-brand-fresh bg-brand-fresh" : "border-gray-300"
                    }`}>
                      {selectedPayment === "cod" && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                </div>
              </section>

              {/* Order Summary */}
              <section className="rounded-2xl border border-border/60 bg-white shadow-sm">
                <div className="border-b border-border/40 px-4 py-3.5">
                  <h2 className="text-sm font-bold">Order Summary</h2>
                </div>
                <div className="p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted text-xs">Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</span>
                    <span className="text-xs font-medium">{formatPrice(getSubtotal())}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-brand-fresh text-xs">
                      <span>Coupon</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {getCoinsDiscount() > 0 && (
                    <div className="flex justify-between text-brand-orange text-xs">
                      <span>Coins</span>
                      <span>-{formatPrice(getCoinsDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Delivery</span>
                    <span className="font-medium">
                      {getDeliveryFee() === 0
                        ? <span className="text-brand-fresh">FREE</span>
                        : formatPrice(getDeliveryFee())
                      }
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2.5 text-base font-bold">
                    <span>Total</span>
                    <span className="text-brand-dark">{formatPrice(getTotal())}</span>
                  </div>
                  {coinsEarned > 0 && (
                    <p className="pt-1 text-center text-[10px] text-brand-fresh">
                      +{coinsEarned} coins earned
                    </p>
                  )}
                </div>

                <div className="px-4 pb-4">
                  <Button
                    variant="fresh"
                    className="w-full rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-brand-fresh/20"
                    onClick={handlePlaceOrder}
                    disabled={confirmingOrder || !selectedAddress || !requiredDetailsFilled}
                  >
                    {confirmingOrder ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : selectedPayment === "razorpay" ? (
                      <><Zap className="mr-2 h-4 w-4" /> Pay ₹{getTotal()} via Razorpay</>
                    ) : (
                      <><Banknote className="mr-2 h-4 w-4" /> Place Order — {formatPrice(getTotal())}</>
                    )}
                  </Button>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted">
                    <Lock className="h-3 w-3" /> Secured by Razorpay
                  </div>
                </div>

                <div className="border-t border-border/40 px-4 py-3">
                  <ReturnPolicyBanner />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Fallback Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-3 pb-6 sm:px-0">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Pay via UPI</h3>
              <button onClick={() => { setShowUPIModal(false); if (!paymentConfirmed) setSelectedPayment("cod"); }}
                className="rounded-full p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted mb-3">
              Send the exact amount to the UPI ID below, then confirm.
            </p>
            <div className="rounded-2xl border-2 border-dashed border-brand-fresh/30 bg-brand-fresh/[0.03] p-4 text-center mb-4">
              <p className="text-[10px] font-medium text-muted mb-2">UPI ID</p>
              <p className="text-sm font-bold text-brand-dark tracking-wide">{PAYMENT_UPI_ID}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(PAYMENT_UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-fresh-dim hover:text-brand-fresh"
              >
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy UPI ID"}
              </button>
            </div>
            <div className="rounded-xl bg-brand-orange/10 px-3 py-2.5 text-center mb-4">
              <p className="text-[10px] font-medium text-brand-orange">Amount to pay</p>
              <p className="text-lg font-extrabold text-brand-dark">{formatPrice(getTotal())}</p>
            </div>
            <button
              onClick={() => { setPaymentConfirmed(true); setShowUPIModal(false); placeOrder("paid"); }}
              className="w-full rounded-full bg-brand-fresh py-3 text-sm font-bold text-white hover:bg-brand-fresh-dim transition-colors"
            >
              <CheckCircle className="mr-1.5 inline h-4 w-4" /> I&apos;ve Paid — Confirm
            </button>
            <p className="mt-3 text-[10px] text-center text-muted">
              <ExternalLink className="mr-0.5 inline h-3 w-3" /> Open GPay / PhonePe / Paytm and pay now
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
