"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, CreditCard, CheckCircle, ChevronRight, Coins, Shield, Lock,
  Smartphone, Building2, Hash, Layers, Package, Copy, X, ExternalLink,
  ArrowLeft, Loader2, Wallet, Banknote, CreditCard as CardIcon, Trash2,
  Plus, Minus, Ticket, Zap, ShoppingBag, Sparkles, Gift, Truck,
  ChevronDown, CircleDot, Dot, Navigation, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, cartLineId, cartLineKey } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
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
  const [addressMissing, setAddressMissing] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);

  const { location: liveLocation, locating, error: geoError, resolvedAddress, resolvedFields, getLocation } = useGeolocation();

  const [newAddress, setNewAddress] = useState({ city: "", pincode: "", area: "", landmark: "", building: "", flat: "", floor: "" });

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

  useEffect(() => {
    if (resolvedFields && liveLocation) {
      setNewAddress(f => ({
        city: resolvedFields.city || f.city,
        pincode: resolvedFields.pincode || f.pincode,
        area: resolvedFields.area || f.area,
        landmark: resolvedFields.landmark || f.landmark,
        building: resolvedFields.building || f.building,
        flat: f.flat,
        floor: f.floor,
      }));
      if (!selectedAddress) {
        setAddressMissing(false);
      }
    }
  }, [resolvedFields]);

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
      toast.add("Please add or select a delivery address", "error");
      setAddressMissing(true);
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setAddressMissing(false), 3000);
      return;
    }
    if (!requiredDetailsFilled) {
      toast.add("Please fill Area, Landmark, and Building details", "error");
      setShowAddressForm(true);
      setAddressMissing(true);
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setAddressMissing(false), 3000);
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
      const addressCords = liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : {};
      const finalId = await createOrder({
        id: orderId,
        items,
        total,
        address: {
          ...selectedAddress,
          ...addressCords,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50/50">
      {/* Premium Header */}
      <div className="sticky top-0 z-10 border-b border-border/30 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button onClick={() => router.push("/cart")} className="group flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-all">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Cart</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-fresh to-brand-blue text-white shadow-sm">
              <ShoppingBag className="h-3 w-3" />
            </div>
            <h1 className="text-base font-bold tracking-tight">Checkout</h1>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted">
            <Lock className="h-3 w-3" />
            <span className="hidden sm:inline">Secure</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">

          {/* ─── Main Column ─── */}
          <div className="space-y-5 lg:col-span-3">

            {/* Step 1 — Delivery Address */}
            <div ref={addressRef} className={`relative rounded-3xl overflow-hidden transition-all duration-500 ${addressMissing ? "ring-8 ring-brand-red/30 shadow-2xl shadow-brand-red/25 address-shake" : "shadow-xl hover:shadow-2xl"}`}>
              {/* Animated gradient border */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br p-[3px] ${addressMissing ? "from-brand-red via-red-500 to-brand-orange animate-pulse" : "from-brand-fresh/40 via-brand-blue/30 to-brand-fresh/40"}`}>
                <div className="h-full w-full rounded-3xl bg-white" />
              </div>
              {/* Glass inner */}
              <div className="relative rounded-3xl bg-white/90 backdrop-blur-sm">
                {/* Error banner */}
                {addressMissing && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-brand-red/20 via-brand-red/12 to-brand-orange/8 px-5 py-3.5 border-b-2 border-brand-red/30">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red/25 animate-bounce">
                      <AlertTriangle className="h-5 w-5 text-brand-red" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-brand-red">Address Required!</p>
                      <p className="text-[11px] text-brand-red/80">Please fill in your delivery details below</p>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-full bg-brand-dark text-white text-[10px] font-bold w-6 h-6">
                      1
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-500 ${addressMissing ? "bg-brand-red/10 scale-110" : "bg-gradient-to-br from-brand-fresh/15 to-brand-blue/15"}`}>
                      <MapPin className={`h-5 w-5 transition-colors duration-500 ${addressMissing ? "text-brand-red" : "text-brand-fresh-dim"}`} />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold tracking-tight">Delivery Address</h2>
                      <p className="text-[10px] text-muted font-medium">Set your drop-off location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAddress ? (
                      <Badge variant={requiredDetailsFilled ? "fresh" : "orange"} className="text-[10px] px-2.5 py-0.5">
                        {requiredDetailsFilled ? "✓ Ready" : "Add details"}
                      </Badge>
                    ) : (
                      <Badge variant="orange" className="text-[10px] px-2.5 py-0.5">Paused</Badge>
                    )}
                  </div>
                </div>

                {!selectedAddress ? (
                  <div className="p-5 space-y-4">
                    <div className="text-center py-2">
                      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 ${addressMissing ? "bg-brand-red/10 scale-110" : "bg-gradient-to-br from-brand-fresh/8 to-brand-blue/8"}`}>
                        <MapPin className={`h-10 w-10 transition-all duration-500 ${addressMissing ? "text-brand-red animate-bounce" : "text-brand-fresh-dim/60"}`} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-brand-dark">Set Your Delivery Address</p>
                      <p className="mt-0.5 text-xs text-muted max-w-xs mx-auto leading-relaxed">Let us know where you are so our delivery partner can find you quickly.</p>
                    </div>

                    {/* Use My Location — prominent */}
                    <button type="button" onClick={getLocation} disabled={locating}
                      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-fresh to-brand-blue p-[1.5px] group disabled:opacity-60"
                    >
                      <div className="flex items-center justify-center gap-2.5 rounded-2xl bg-white px-4 py-3.5 group-hover:bg-transparent group-hover:text-white transition-all duration-300">
                        <Navigation className={`h-5 w-5 text-brand-fresh-dim group-hover:text-white transition-all ${locating ? "animate-spin" : "group-hover:scale-110"}`} />
                        <span className="text-sm font-bold text-brand-dark group-hover:text-white transition-all">
                          {locating ? "Detecting your location..." : liveLocation ? "✓ Location Detected" : "📍 Use My Current Location"}
                        </span>
                      </div>
                    </button>
                    {resolvedAddress && (
                      <div className="rounded-xl bg-brand-fresh/5 border border-brand-fresh/10 px-4 py-2.5 text-center">
                        <p className="text-[11px] text-brand-fresh-dim font-medium">{resolvedAddress}</p>
                      </div>
                    )}
                    {geoError && (
                      <div className="rounded-xl bg-brand-red/5 border border-brand-red/10 px-4 py-2 text-center">
                        <p className="text-[10px] text-brand-red">{geoError}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[10px] text-muted font-medium uppercase tracking-widest">or type manually</span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">City *</label>
                        <div className="mt-1 relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
                          <input value={newAddress.city} onChange={(e) => setNewAddress(f => ({ ...f, city: e.target.value }))}
                            placeholder="Siliguri"
                            className="w-full rounded-xl border border-border/50 bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Pincode *</label>
                        <div className="mt-1 relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
                          <input value={newAddress.pincode} onChange={(e) => setNewAddress(f => ({ ...f, pincode: e.target.value }))}
                            placeholder="734009"
                            className="w-full rounded-xl border border-border/50 bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Area / Locality *</label>
                      <div className="mt-1 relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
                        <input value={newAddress.area} onChange={(e) => setNewAddress(f => ({ ...f, area: e.target.value }))}
                          placeholder="e.g. Salbari, Dabgram"
                          className="w-full rounded-xl border border-border/50 bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Landmark *</label>
                        <input value={newAddress.landmark} onChange={(e) => setNewAddress(f => ({ ...f, landmark: e.target.value }))}
                          placeholder="Near City Centre"
                          className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Building *</label>
                        <input value={newAddress.building} onChange={(e) => setNewAddress(f => ({ ...f, building: e.target.value }))}
                          placeholder="Green Tower"
                          className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Flat / Apt</label>
                        <input value={newAddress.flat} onChange={(e) => setNewAddress(f => ({ ...f, flat: e.target.value }))}
                          placeholder="3B"
                          className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Floor</label>
                        <input value={newAddress.floor} onChange={(e) => setNewAddress(f => ({ ...f, floor: e.target.value }))}
                          placeholder="2nd"
                          className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                      </div>
                    </div>
                    <Button variant="default" size="lg" className="w-full rounded-2xl py-3.5 text-sm font-bold shadow-xl shadow-brand-dark/15 hover:shadow-2xl hover:shadow-brand-dark/20 transition-all"
                      disabled={!newAddress.area.trim() || !newAddress.landmark.trim() || !newAddress.building.trim() || !newAddress.city.trim() || !newAddress.pincode.trim()}
                      onClick={() => {
                        if (!newAddress.area.trim() || !newAddress.landmark.trim() || !newAddress.building.trim() || !newAddress.city.trim() || !newAddress.pincode.trim()) {
                          toast.add("Please fill all required fields", "error");
                          return;
                        }
                        const addr: Address = {
                          id: crypto.randomUUID(),
                          label: "Home",
                          line1: `${newAddress.building.trim()}, ${newAddress.area.trim()}`,
                          city: newAddress.city.trim(),
                          pincode: newAddress.pincode.trim(),
                          area: newAddress.area.trim(),
                          landmark: newAddress.landmark.trim(),
                          building: newAddress.building.trim(),
                          flat: newAddress.flat.trim() || undefined,
                          floor: newAddress.floor.trim() || undefined,
                          isDefault: addresses.length === 0,
                          ...(liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : {}),
                        };
                        useUserStore.getState().addAddress(addr);
                        setSelectedAddressId(addr.id);
                        setDetailForm({
                          area: addr.area ?? "",
                          landmark: addr.landmark ?? "",
                          building: addr.building ?? "",
                          flat: addr.flat ?? "",
                          floor: addr.floor ?? "",
                        });
                        toast.add("✓ Address saved! Ready to check out");
                      }}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" /> Save &amp; Continue to Payment
                    </Button>
                  </div>
                ) : (
                  <div className="p-5">
                    {addresses.length > 1 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault);
                          return (
                            <button
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`rounded-xl border px-3.5 py-2.5 text-left text-xs transition-all ${
                                isSelected
                                  ? "border-brand-fresh bg-gradient-to-r from-brand-fresh/5 to-brand-blue/5 ring-2 ring-brand-fresh/15 shadow-md"
                                  : "border-border/40 hover:border-gray-300 bg-white shadow-sm"
                              }`}
                            >
                              <span className="font-semibold">{addr.label}</span>
                              <span className="block text-muted mt-0.5 text-[10px]">{addr.line1?.slice(0, 22)}...</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className={`rounded-2xl p-4 transition-all duration-300 ${addressMissing ? "bg-brand-red/5 border-2 border-brand-red/30 ring-2 ring-brand-red/15" : "bg-gradient-to-br from-gray-50 via-white to-brand-fresh/[0.02] border border-border/20"}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-fresh/10">
                              <MapPin className="h-3.5 w-3.5 text-brand-fresh-dim" />
                            </div>
                            <p className="text-sm font-bold text-brand-dark">{selectedAddress.line1}</p>
                          </div>
                          <p className="text-xs text-muted pl-9.5">
                            {selectedAddress.city}{selectedAddress.pincode ? ` — ${selectedAddress.pincode}` : ""}
                          </p>
                          {selectedAddress.area && (
                            <p className="text-xs text-muted pl-9.5 flex items-center gap-1">
                              <Layers className="h-3 w-3" /> {selectedAddress.area}
                            </p>
                          )}
                          {selectedAddress.landmark && (
                            <p className="text-xs text-muted pl-9.5 flex items-center gap-1">
                              <Dot className="h-3 w-3 text-brand-fresh" /> Near {selectedAddress.landmark}
                            </p>
                          )}
                          {selectedAddress.building && (
                            <p className="text-xs text-muted pl-9.5 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {selectedAddress.building}
                              {selectedAddress.flat ? `, Flat ${selectedAddress.flat}` : ""}
                              {selectedAddress.floor ? `, Floor ${selectedAddress.floor}` : ""}
                            </p>
                          )}
                          {selectedAddress.lat && selectedAddress.lng && (
                            <div className="pl-9.5 pt-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-fresh/10 border border-brand-fresh/15 px-2.5 py-0.5 text-[10px] font-semibold text-brand-fresh-dim">
                                <Navigation className="h-3 w-3" /> GPS Location Saved
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowAddressForm(!showAddressForm)}
                          className="shrink-0 rounded-xl border-2 border-brand-fresh/20 bg-white px-4 py-2 text-xs font-bold text-brand-fresh-dim hover:bg-brand-fresh hover:text-white hover:border-brand-fresh transition-all shadow-sm"
                        >
                          {showAddressForm ? "Done" : "Edit Details"}
                        </button>
                      </div>
                    </div>

                    {showAddressForm && (
                      <div className="mt-4 space-y-3 border-t-2 border-brand-fresh/10 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-brand-fresh" />
                          <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Delivery Details</p>
                        </div>
                        <button type="button" onClick={getLocation} disabled={locating}
                          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-fresh to-brand-blue p-[1.5px] group disabled:opacity-60"
                        >
                          <div className="flex items-center justify-center gap-2.5 rounded-2xl bg-white px-4 py-3.5 group-hover:bg-transparent group-hover:text-white transition-all duration-300">
                            <Navigation className={`h-5 w-5 text-brand-fresh-dim group-hover:text-white transition-all ${locating ? "animate-spin" : "group-hover:scale-110"}`} />
                            <span className="text-sm font-bold text-brand-dark group-hover:text-white transition-all">
                              {locating ? "Detecting location..." : liveLocation ? "✓ Location Detected" : "📍 Use My Current Location"}
                            </span>
                          </div>
                        </button>
                        {resolvedAddress && (
                          <div className="rounded-xl bg-brand-fresh/5 border border-brand-fresh/10 px-4 py-2.5 text-center">
                            <p className="text-[11px] text-brand-fresh-dim font-medium">{resolvedAddress}</p>
                          </div>
                        )}
                        {geoError && (
                          <div className="rounded-xl bg-brand-red/5 border border-brand-red/10 px-4 py-2 text-center">
                            <p className="text-[10px] text-brand-red">{geoError}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Area / Locality *</label>
                            <div className="mt-1 relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
                              <input value={detailForm.area} onChange={(e) => setDetailForm(f => ({ ...f, area: e.target.value }))}
                                placeholder="e.g. Salbari"
                                className="w-full rounded-xl border border-border/50 bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Landmark *</label>
                            <input value={detailForm.landmark} onChange={(e) => setDetailForm(f => ({ ...f, landmark: e.target.value }))}
                              placeholder="Near City Centre"
                              className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Building *</label>
                            <div className="mt-1 relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
                              <input value={detailForm.building} onChange={(e) => setDetailForm(f => ({ ...f, building: e.target.value }))}
                                placeholder="Green Tower"
                                className="w-full rounded-xl border border-border/50 bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Flat / Apt</label>
                            <input value={detailForm.flat} onChange={(e) => setDetailForm(f => ({ ...f, flat: e.target.value }))}
                              placeholder="3B"
                              className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted uppercase tracking-wide">Floor</label>
                            <input value={detailForm.floor} onChange={(e) => setDetailForm(f => ({ ...f, floor: e.target.value }))}
                              placeholder="2nd"
                              className="mt-1 w-full rounded-xl border border-border/50 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-300 focus:border-brand-fresh/60 focus:ring-2 focus:ring-brand-fresh/15 outline-none transition-all" />
                          </div>
                        </div>
                        <Button variant="fresh" size="sm" className="rounded-xl text-xs font-bold shadow-lg shadow-brand-fresh/20 hover:shadow-xl hover:shadow-brand-fresh/30 transition-all"
                          onClick={() => {
                            if (!detailForm.area.trim() || !detailForm.landmark.trim() || !detailForm.building.trim()) {
                              toast.add("Please fill Area, Landmark and Building", "error");
                              return;
                            }
                            saveAddressDetails();
                            setShowAddressForm(false);
                            toast.add("✓ Delivery details saved!");
                          }}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" /> Save Details
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-2xl border border-border/50 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-fresh/10 to-brand-blue/10">
                    <Package className="h-4 w-4 text-brand-fresh-dim" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Items Ordered</h2>
                    <p className="text-[10px] text-muted">{items.length} {items.length === 1 ? "item" : "items"}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-dark tabular-nums">{formatPrice(getSubtotal())}</span>
              </div>
              <div className="divide-y divide-border/20">
                {items.map((item, idx) => (
                  <div key={cartLineId(cartLineKey(item))} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-gray-50/50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-fresh/[0.08] to-brand-blue/[0.08] text-xs font-bold text-brand-fresh-dim border border-brand-fresh/10">
                      {item.quantity}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-[10px] text-muted">{item.selectedWeight || item.product.unit}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Loyalty Coins */}
            {coinBalance >= 100 && (
              <div className="rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/60 to-white shadow-sm transition-all hover:shadow-md">
                <button onClick={() => setShowCoins(!showCoins)} className="flex w-full items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20">
                      <Coins className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold">Loyalty Coins</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {coinBalance.toLocaleString()} available
                        </span>
                      </div>
                      <p className="text-[10px] text-muted">Redeem for discounts on this order</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-300 ${showCoins ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${showCoins ? "max-h-40" : "max-h-0"}`}>
                  <div className="border-t border-amber-200/20 px-5 pb-4 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted">
                          {coinsRedeemed > 0
                            ? `${coinsRedeemed.toLocaleString()} coins — saves ${formatPrice(getCoinsDiscount())}`
                            : `Redeem up to ${formatPrice(Math.min(maxRedeemable, 500) / 100 * 50)}`}
                        </p>
                        <div className="mt-1 flex gap-1">
                          <Gift className="h-3 w-3 text-amber-500" />
                          <span className="text-[10px] font-medium text-amber-600">
                            {coinsRedeemed > 0
                              ? "Discount applied!"
                              : `${formatPrice(Math.min(maxRedeemable, 500) / 100 * 50)} max savings`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleCoins}
                        className={`rounded-full px-5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                          coinsRedeemed > 0
                            ? "bg-brand-red/10 text-brand-red hover:bg-brand-red/20"
                            : "bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-700 hover:from-amber-400/30 hover:to-orange-400/30"
                        }`}
                      >
                        {coinsRedeemed > 0 ? "Remove" : "Apply Coins"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Sidebar ─── */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 space-y-5">

              {/* Payment Method */}
              <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
                <div className="border-b border-border/30 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-fresh/10 to-brand-blue/10">
                      <CreditCard className="h-4 w-4 text-brand-fresh-dim" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold">Payment</h2>
                      <p className="text-[10px] text-muted">Choose how to pay</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <button
                    onClick={() => setSelectedPayment("razorpay")}
                    className={`relative flex w-full items-center gap-3.5 rounded-xl border-2 p-4 text-left transition-all ${
                      selectedPayment === "razorpay"
                        ? "border-brand-fresh bg-gradient-to-r from-brand-fresh/[0.04] to-brand-blue/[0.02] ring-1 ring-brand-fresh/20 shadow-sm"
                        : "border-border/40 hover:border-gray-300 bg-white shadow-sm"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                      selectedPayment === "razorpay" ? "bg-brand-fresh/10 shadow-sm" : "bg-gray-50"
                    }`}>
                      <Zap className={`h-5 w-5 ${selectedPayment === "razorpay" ? "text-brand-fresh-dim" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Razorpay</p>
                      <p className="text-[11px] text-muted">UPI, Card, NetBanking, Wallet</p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      selectedPayment === "razorpay" ? "border-brand-fresh bg-brand-fresh shadow-sm" : "border-gray-300"
                    }`}>
                      {selectedPayment === "razorpay" && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPayment("cod")}
                    className={`relative flex w-full items-center gap-3.5 rounded-xl border-2 p-4 text-left transition-all ${
                      selectedPayment === "cod"
                        ? "border-brand-fresh bg-gradient-to-r from-brand-fresh/[0.04] to-brand-blue/[0.02] ring-1 ring-brand-fresh/20 shadow-sm"
                        : "border-border/40 hover:border-gray-300 bg-white shadow-sm"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                      selectedPayment === "cod" ? "bg-brand-fresh/10 shadow-sm" : "bg-gray-50"
                    }`}>
                      <Banknote className={`h-5 w-5 ${selectedPayment === "cod" ? "text-brand-fresh-dim" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Cash on Delivery</p>
                      <p className="text-[11px] text-muted">Pay when you receive</p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      selectedPayment === "cod" ? "border-brand-fresh bg-brand-fresh shadow-sm" : "border-gray-300"
                    }`}>
                      {selectedPayment === "cod" && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
                <div className="border-b border-border/30 bg-gradient-to-r from-brand-dark/[0.02] to-transparent px-5 py-4">
                  <h2 className="text-sm font-bold">Order Summary</h2>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs">Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</span>
                    <span className="text-xs font-medium tabular-nums">{formatPrice(getSubtotal())}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-[11px] text-brand-fresh">
                        <Sparkles className="h-3 w-3" /> Coupon
                      </span>
                      <span className="text-xs font-medium text-brand-fresh">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {getCoinsDiscount() > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-[11px] text-amber-600">
                        <Coins className="h-3 w-3" /> Coins
                      </span>
                      <span className="text-xs font-medium text-amber-600">-{formatPrice(getCoinsDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs">Delivery</span>
                    <span className="text-xs font-medium">
                      {getDeliveryFee() === 0
                        ? <span className="flex items-center gap-1 text-brand-fresh"><Truck className="h-3 w-3" /> FREE</span>
                        : formatPrice(getDeliveryFee())
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/30 pt-3 text-base font-bold">
                    <span>Total</span>
                    <span className="text-brand-dark tabular-nums">{formatPrice(getTotal())}</span>
                  </div>
                  {coinsEarned > 0 && (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-fresh/[0.06] to-brand-blue/[0.04] py-2">
                      <Gift className="h-3.5 w-3.5 text-brand-fresh-dim" />
                      <span className="text-[10px] font-semibold text-brand-fresh-dim">
                        +{coinsEarned} loyalty coins earned
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  <Button
                    variant="default"
                    className="w-full rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-brand-dark/20 transition-all hover:shadow-xl"
                    onClick={handlePlaceOrder}
                    disabled={confirmingOrder || !selectedAddress || !requiredDetailsFilled}
                  >
                    {confirmingOrder ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : selectedPayment === "razorpay" ? (
                      <><Zap className="mr-2 h-4 w-4" /> Pay ₹{getTotal().toLocaleString()} via Razorpay</>
                    ) : (
                      <><Banknote className="mr-2 h-4 w-4" /> Place Order — {formatPrice(getTotal())}</>
                    )}
                  </Button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted">
                    <Lock className="h-3 w-3" /> Secured by Razorpay
                    <span className="mx-1.5">·</span>
                    <Shield className="h-3 w-3" /> 30-min delivery
                  </div>
                </div>

                <div className="border-t border-border/30 px-5 py-3">
                  <ReturnPolicyBanner />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Fallback Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-3 pb-6 sm:px-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border/30 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-fresh/10 to-brand-blue/10">
                  <Smartphone className="h-4 w-4 text-brand-fresh-dim" />
                </div>
                <h3 className="text-sm font-bold">Pay via UPI</h3>
              </div>
              <button onClick={() => { setShowUPIModal(false); if (!paymentConfirmed) setSelectedPayment("cod"); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 hover:bg-gray-50 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted mb-4 leading-relaxed">
              Send the exact amount to the UPI ID below using GPay, PhonePe, or Paytm, then confirm.
            </p>

            <div className="rounded-2xl border-2 border-dashed border-brand-fresh/30 bg-gradient-to-br from-brand-fresh/[0.03] to-white p-5 text-center mb-4">
              <p className="text-[10px] font-medium text-muted mb-1.5">UPI ID</p>
              <p className="text-sm font-bold text-brand-dark tracking-wide">{PAYMENT_UPI_ID}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(PAYMENT_UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white border border-border/40 px-3 py-1 text-[10px] font-semibold text-brand-fresh-dim hover:text-brand-fresh hover:border-brand-fresh/30 transition-all"
              >
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy UPI ID"}
              </button>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/30 px-4 py-3 text-center mb-5">
              <p className="text-[10px] font-medium text-amber-700">Amount to pay</p>
              <p className="text-xl font-extrabold text-brand-dark tabular-nums">{formatPrice(getTotal())}</p>
            </div>

            <button
              onClick={() => { setPaymentConfirmed(true); setShowUPIModal(false); placeOrder("paid"); }}
              className="w-full rounded-full bg-gradient-to-r from-brand-fresh to-brand-blue py-3 text-sm font-bold text-white shadow-lg shadow-brand-fresh/20 hover:shadow-xl transition-all"
            >
              <CheckCircle className="mr-1.5 inline h-4 w-4" /> I&apos;ve Paid — Confirm
            </button>

            <p className="mt-4 text-[10px] text-center text-muted flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" /> Open GPay / PhonePe / Paytm to complete payment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
