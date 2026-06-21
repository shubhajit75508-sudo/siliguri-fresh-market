"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Copy, X, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, cartLineId, cartLineKey } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { useCouponStore } from "@/store/coupon-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { formatPrice, getWeightMultiplier } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
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

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydrated();
  const { items, getSubtotal, getTotal, getDeliveryFee, getCoinsDiscount, couponDiscount, clearCart, setCoinsDiscount, updateQuantity, removeItem, applyCoupon: applyCartCoupon, removeCoupon } = useCartStore();
  const { addresses, user, coinsRedeemed, applyCoinsRedemption, removeCoinsRedemption, earnCoins, redeemCoins } = useUserStore();
  const { currentUser } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { coupons } = useCouponStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "cod">("razorpay");
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailForm, setDetailForm] = useState({ area: "", landmark: "", building: "", flat: "", floor: "", street: "", deliveryInstructions: "" });
  const [addressMissing, setAddressMissing] = useState(false);
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [contactForm, setContactForm] = useState({ name: currentUser?.name || "", phone: currentUser?.phone || "", email: currentUser?.email || "" });
  const addressRef = useRef<HTMLDivElement>(null);

  const { location: liveLocation, locating, error: geoError, getLocation } = useGeolocation();

  const [newAddress, setNewAddress] = useState({ city: "", pincode: "", area: "", landmark: "", building: "", flat: "", floor: "", street: "", deliveryInstructions: "" });
  const [addrType, setAddrType] = useState("home");

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault) || addresses[0];
  const coinBalance = user?.loyaltyPoints ?? 0;
  const maxRedeemable = Math.floor(coinBalance / 100) * 100;
  const isAuthenticated = !!(currentUser && (currentUser.role === "customer" || currentUser.role === "admin"));
  const requiredDetailsFilled = !!(detailForm.area.trim()) && !!(detailForm.landmark.trim());

  useEffect(() => {
    if (selectedAddress) {
      setDetailForm({
        area: selectedAddress.area ?? "",
        landmark: selectedAddress.landmark ?? "",
        building: selectedAddress.building ?? "",
        flat: selectedAddress.flat ?? "",
        floor: selectedAddress.floor ?? "",
        street: selectedAddress.street ?? "",
        deliveryInstructions: selectedAddress.deliveryInstructions ?? "",
      });
      setNewAddress(f => ({
        ...f,
        city: selectedAddress.city || f.city,
        pincode: selectedAddress.pincode || f.pincode,
      }));
    }
  }, [selectedAddress]);

  const handleToggleCoins = () => {
    if (coinsRedeemed > 0) { removeCoinsRedemption(); setCoinsDiscount(0); toast.add("Coins removed"); }
    else {
      const redeem = Math.min(maxRedeemable, 500);
      if (redeem < 100) { toast.add("Need at least 100 coins to redeem", "error"); return; }
      const discount = (redeem / 100) * 50; applyCoinsRedemption(redeem); setCoinsDiscount(discount);
      toast.add(`${redeem} coins applied — ₹${discount} off`);
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponMsg({ text: "Enter a coupon code first", ok: false }); return; }
    const c = coupons.find(c => c.code.toUpperCase() === code);
    if (c) {
      const d = c.type === "percentage" ? Math.round(getSubtotal() * c.discount / 100) : c.discount;
      if (getSubtotal() >= c.minOrder) {
        applyCartCoupon(c.code, d);
        setCouponMsg({ text: `"${code}" applied — ${c.discount}${c.type === "percentage" ? "%" : "₹"} off!`, ok: true });
      } else {
        setCouponMsg({ text: `Minimum order ₹${c.minOrder} required`, ok: false });
      }
    } else {
      setCouponMsg({ text: "Invalid coupon code", ok: false });
    }
  };

  const openRazorpayCheckout = async () => {
    const total = getTotal(); setConfirmingOrder(true);
    const sfmOrderId = "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setConfirmingOrder(false); setShowUPIModal(true); return; }
      const res = await fetch("/api/payment/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR", receipt: sfmOrderId, notes: { order_id: sfmOrderId, customer_name: currentUser?.name ?? "", customer_phone: currentUser?.phone ?? "", customer_email: currentUser?.email ?? "" } }),
      });
      if (!res.ok) { setConfirmingOrder(false); setShowUPIModal(true); return; }
      const order = await res.json();
      const razorpay = new (window as any).Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency, name: "Siliguri Fresh Mart", description: `Order ${sfmOrderId}`, order_id: order.id,
        image: "https://siligurifreshmart.com/favicon.ico", theme: { color: "#16a34a" },
        prefill: { name: currentUser?.name, email: currentUser?.email, contact: currentUser?.phone, method: "upi" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
          if (verifyRes.ok) { setPaymentConfirmed(true); placeOrder("paid", sfmOrderId); }
          else { toast.add("Payment verification failed. Contact support.", "error"); setConfirmingOrder(false); }
        },
        modal: { ondismiss: () => { setConfirmingOrder(false); toast.add("Payment cancelled. You can retry or choose COD.", "error"); } },
      });
      razorpay.on("payment.failed", (response: { error: { code: string; description: string } }) => { setConfirmingOrder(false); toast.add(`Payment failed: ${response.error.description}`, "error"); });
      razorpay.open();
    } catch { setConfirmingOrder(false); setShowUPIModal(true); }
  };

  const handlePlaceOrder = () => {
    if (!isAuthenticated) { toast.add("Sign up required to place orders", "error"); return; }
    if (!selectedAddress) { toast.add("Please add or select a delivery address", "error"); setAddressMissing(true); addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => setAddressMissing(false), 3000); return; }
    if (!requiredDetailsFilled) { toast.add("Please fill Area and Landmark details", "error"); setAddressMissing(true); addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => setAddressMissing(false), 3000); return; }
    if (selectedPayment === "razorpay") { openRazorpayCheckout(); return; }
    placeOrder("unpaid");
  };

  const placeOrder = (paymentStatus: "paid" | "unpaid", orderId?: string) => {
    setConfirmingOrder(true); const total = getTotal();
    (async () => {
      const addressCords = liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : {};
      const finalId = await createOrder({
        id: orderId, items, total,
        address: { ...selectedAddress, ...addressCords, area: detailForm.area.trim() || selectedAddress.area || undefined, landmark: detailForm.landmark.trim() || selectedAddress.landmark || undefined, building: detailForm.building.trim() || selectedAddress.building || undefined, flat: detailForm.flat.trim() || selectedAddress.flat || undefined, floor: detailForm.floor.trim() || selectedAddress.floor || undefined, street: detailForm.street.trim() || selectedAddress.street || undefined, deliveryInstructions: detailForm.deliveryInstructions.trim() || selectedAddress.deliveryInstructions || undefined },
        paymentMethod: selectedPayment === "razorpay" ? "upi" : "cod", paymentStatus,
        customerName: currentUser?.name ?? "Guest", customerPhone: currentUser?.phone ?? "", customerEmail: currentUser?.email ?? "", userId: currentUser?.id,
      });
      if (coinsRedeemed > 0) redeemCoins(coinsRedeemed);
      earnCoins(total); clearCart(); setPaymentConfirmed(false); setShowUPIModal(false);
      const earned = Math.floor(total / 100) * 10;
      toast.add(`Order placed! +${earned} coins earned.`);
      router.push(`/track/${finalId}`);
    })().catch(() => { setConfirmingOrder(false); toast.add("Failed to place order. Please try again.", "error"); });
  };

  const saveAddressDetails = () => {
    if (!selectedAddress) return;
    useUserStore.getState().updateAddress({ ...selectedAddress, area: detailForm.area.trim() || selectedAddress.area || undefined, landmark: detailForm.landmark.trim() || selectedAddress.landmark || undefined, building: detailForm.building.trim() || selectedAddress.building || undefined, flat: detailForm.flat.trim() || selectedAddress.flat || undefined, floor: detailForm.floor.trim() || selectedAddress.floor || undefined, street: detailForm.street.trim() || selectedAddress.street || undefined, deliveryInstructions: detailForm.deliveryInstructions.trim() || selectedAddress.deliveryInstructions || undefined });
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🛒</span>
        <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
        <p className="mt-1 text-sm text-[#80949b]">Add items to get started</p>
        <Button className="mt-6 rounded-full bg-[#2ecc71] hover:bg-[#27ae60] text-[#0a1f1c] font-bold" onClick={() => router.push("/")}>Continue Shopping</Button>
      </div>
    );
  }

  if (hydrated && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <span className="text-5xl mb-4 block">🔒</span>
          <h2 className="text-2xl font-extrabold text-white">Sign Up Required</h2>
          <p className="mt-2 text-sm text-[#80949b]">Create an account to place orders.</p>
          <div className="mt-6 space-y-3">
            <Link href="/auth/signup"><Button className="w-full rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] text-[#0a1f1c] font-bold py-3">Create Account</Button></Link>
            <Link href="/auth/login"><Button variant="outline" className="w-full rounded-xl border-white/10 text-white hover:bg-white/5 py-3">Log In</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const total = getTotal();
  const saving = couponDiscount + getCoinsDiscount();
  const catBadge = (cat: string) => {
    if (["fish","chicken","mutton","seafood"].includes(cat)) return { label:"FRESH", cls:"fresh" };
    if (["fruits","vegetables"].includes(cat)) return { label:"ORGANIC", cls:"organic" };
    if (["dairy","eggs"].includes(cat)) return { label:"FARM", cls:"farm" };
    return null;
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-lg px-4 py-5">

        {/* Brand Bar + Step Pill */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Siliguri Fresh Mart</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2ecc71] mt-0.5">From Market to Your Home</p>
          </div>
          <div className="rounded-full bg-[#2ecc71]/15 border border-[#2ecc71]/35 px-3.5 py-1.5 text-[11px] font-bold text-[#2ecc71] tracking-wider">
            Step {step} of 3
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8">
          {[ {n:1,l:"Cart"},{n:2,l:"Delivery"},{n:3,l:"Payment"} ].map((s,i) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border flex-shrink-0 ${
                  step > s.n ? "bg-[#2ecc71] border-[#2ecc71] text-[#0a1f1c]" : step === s.n ? "bg-[#2ecc71]/20 border-[#2ecc71] text-[#2ecc71]" : "bg-white/5 border-white/10 text-[#80949b]"
                }`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider hidden sm:inline ${step >= s.n ? "text-white" : "text-[#80949b]"}`}>{s.l}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-1.5 ${step > s.n ? "bg-[#2ecc71]/40" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: CART ── */}
        {step === 1 && (
          <>
            {/* Cart Items */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">🛒</span>
                <div>
                  <h2 className="text-sm font-bold text-white">Your Cart</h2>
                  <p className="text-[10px] text-[#80949b]">Review before checkout</p>
                </div>
                <div className="ml-auto rounded-full bg-[#2ecc71]/15 border border-[#2ecc71]/25 px-3 py-1 text-[10px] font-bold text-[#2ecc71]">
                  {items.reduce((n,i) => n + i.quantity, 0)} items
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {items.map((item) => {
                  const lineKey = cartLineKey(item);
                  const b = catBadge(item.product.category);
                  return (
                    <div key={cartLineId(lineKey)} className="group flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors relative">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                        <img src={item.product.image} alt="" className="w-full h-full object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-white truncate">{item.product.name}</span>
                          {b && <span className={`product-badge ${b.cls}`}>{b.label}</span>}
                        </div>
                        <p className="text-[11px] text-[#80949b] mt-0.5">{item.selectedWeight || item.product.unit}</p>
                        <p className="text-[10px] text-[#5a7278] mt-1">
                          {item.product.originalPrice && item.product.originalPrice > item.product.price ? (
                            <>MRP <span className="line-through">₹{item.product.originalPrice}</span> &nbsp;</>
                          ) : null}
                          <span className="text-[#2ecc71] font-bold">₹{item.product.price}/unit</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-extrabold text-white">₹{(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity).toFixed(0)}</span>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0 rounded-lg bg-white/8">
                          <button onClick={() => { const k = cartLineKey(item); if (item.quantity <= 1) removeItem(k); else updateQuantity(k, item.quantity - 1); }} className="w-7 h-7 flex items-center justify-center text-white/70 hover:bg-white/10 rounded-l-lg text-sm font-bold">−</button>
                          <span className="min-w-[28px] text-center text-[13px] font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-white/70 hover:bg-white/10 rounded-r-lg text-sm font-bold">+</button>
                        </div>
                          <button onClick={() => removeItem(cartLineKey(item))} className="w-6 h-6 rounded-md bg-[#e74c3c]/10 border border-[#e74c3c]/20 flex items-center justify-center text-[10px] text-[#e74c3c] hover:bg-[#e74c3c]/20 transition-colors">✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">🧾</span>
                <h2 className="text-sm font-bold text-white">Bill Summary</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-[#80949b]">Subtotal ({items.reduce((n,i) => n + i.quantity, 0)} items)</span><span className="text-white font-semibold">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-[#80949b]">Delivery</span><span className="text-[#2ecc71] font-semibold">🚚 FREE</span></div>
                {saving > 0 && <div className="flex justify-between text-[13px] text-[#2ecc71]"><span>💰 You&apos;re saving</span><span className="font-semibold">{formatPrice(saving)}</span></div>}
                <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-[15px] font-extrabold text-white">Total</span><span className="text-lg font-extrabold text-white">{formatPrice(total)}</span></div>
              </div>
              <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-[#2ecc71]/10 border border-[#2ecc71]/20 px-4 py-2.5 text-[11px] text-white/70">
                <span>🕐</span> Estimated delivery <strong className="text-white mx-1">within 45–60 min</strong> after order confirmation.
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {["🔒 Secure Checkout","🌿 100% Fresh","🚚 Free Delivery"].map((t) => (
                <span key={t} className="text-[10px] font-semibold text-[#80949b] tracking-wider">{t}</span>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 2: DELIVERY ── */}
        {step === 2 && (
          <>
            {/* Contact */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">👤</span>
                <div><h2 className="text-sm font-bold text-white">Contact</h2><p className="text-[10px] text-[#80949b]">So we can reach you</p></div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Full Name <span className="text-[#e74c3c] text-xs">*</span></label>
                  <input type="text" value={contactForm.name} onChange={(e) => setContactForm(c => ({ ...c, name: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="Rajan Sharma" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Phone <span className="text-[#e74c3c] text-xs">*</span></label>
                  <div className="flex"><div className="bg-[#2ecc71]/15 border border-white/15 border-r-0 rounded-l-xl px-3 py-2.5 text-xs font-bold text-[#2ecc71] whitespace-nowrap flex items-center gap-1">🇮🇳 +91</div><input type="tel" value={contactForm.phone} onChange={(e) => setContactForm(c => ({ ...c, phone: e.target.value }))} className="flex-1 bg-white/5 border border-white/15 rounded-r-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="98765 43210" /></div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Email <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <input type="email" value={contactForm.email} onChange={(e) => setContactForm(c => ({ ...c, email: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="you@example.com" />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div ref={addressRef} className={`glass rounded-2xl overflow-hidden border mb-3.5 transition-all duration-500 ${addressMissing ? "border-[#e74c3c]/50 ring-2 ring-[#e74c3c]/20 address-shake" : "border-white/10"}`}>
              {addressMissing && (
                <div className="flex items-center gap-2 bg-[#e74c3c]/10 border-b border-[#e74c3c]/20 px-4 py-2.5"><span className="text-lg">⚠️</span><span className="text-xs font-bold text-[#e74c3c]">Address required — please fill delivery details</span></div>
              )}
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">🏠</span>
                <div><h2 className="text-sm font-bold text-white">Delivery Address</h2><p className="text-[10px] text-[#80949b]">Where should we deliver?</p></div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">House / Flat <span className="text-[#e74c3c] text-xs">*</span></label>
                  <input value={detailForm.building} onChange={(e) => setDetailForm(f => ({ ...f, building: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="12B, Ground Floor" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Building <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <input value={detailForm.flat} onChange={(e) => setDetailForm(f => ({ ...f, flat: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="Green Valley Apts" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Street / Road <span className="text-[#e74c3c] text-xs">*</span></label>
                  <input value={detailForm.street} onChange={(e) => setDetailForm(f => ({ ...f, street: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="Sevoke Road, Near City Centre" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Area <span className="text-[#e74c3c] text-xs">*</span></label>
                  <input value={detailForm.area} onChange={(e) => setDetailForm(f => ({ ...f, area: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="Hakimpara, Pradhan Nagar..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Pincode <span className="text-[#e74c3c] text-xs">*</span></label>
                  <input value={newAddress.pincode} onChange={(e) => setNewAddress(f => ({ ...f, pincode: e.target.value }))} maxLength={6} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="734001" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Landmark <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <input value={detailForm.landmark} onChange={(e) => setDetailForm(f => ({ ...f, landmark: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="Opposite SBI Bank" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">City <span className="text-[#e74c3c] text-xs">*</span></label>
                  <input value={newAddress.city} onChange={(e) => setNewAddress(f => ({ ...f, city: e.target.value }))} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10" placeholder="Siliguri" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-1.5 block">Delivery Note <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <textarea value={detailForm.deliveryInstructions} onChange={(e) => setDetailForm(f => ({ ...f, deliveryInstructions: e.target.value }))} rows={2} className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2ecc71]/50 focus:ring-2 focus:ring-[#2ecc71]/10 resize-none" placeholder="Ring bell twice · Leave at door..." />
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="h-px bg-white/10 my-2" />
                <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#80949b] mb-2 block">Address Type</label>
                <div className="flex gap-2 flex-wrap">
                  {["🏠 Home","🏢 Work","📍 Other"].map((t) => {
                    const val = t.split(" ")[1].toLowerCase();
                    return (
                      <button key={val} onClick={() => setAddrType(val)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          addrType === val ? "bg-[#2ecc71]/15 border-[#2ecc71]/50 text-[#2ecc71]" : "bg-white/5 border-white/10 text-[#80949b] hover:bg-white/10"
                        }`}
                      >{t}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pin Your Location */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">📌</span>
                <div><h2 className="text-sm font-bold text-white">Pin Your Location</h2><p className="text-[10px] text-[#80949b]">Helps our rider reach you exactly</p></div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 rounded-xl bg-[#4A8FE7]/10 border border-[#4A8FE7]/20 px-4 py-2.5 text-[11px] text-white/70 mb-4"><span>💡</span> Tap <strong className="text-white mx-0.5">Detect</strong> to auto-locate or click anywhere on the map.</div>
                <div className="w-full h-48 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  {liveLocation ? (
                    <div className="text-center">
                      <span className="text-3xl">📍</span>
                      <p className="text-xs text-[#2ecc71] mt-2 font-semibold">GPS Location Saved</p>
                      <p className="text-[10px] text-[#80949b] mt-1">{liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)}</p>
                    </div>
                  ) : (
                    <div className="text-center opacity-60"><span className="text-3xl">🗺️</span><p className="text-xs text-[#80949b] mt-2">Tap Detect to pin your location</p></div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={getLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4A8FE7]/20 border border-[#4A8FE7]/30 text-[#8FC4FF] text-xs font-bold hover:bg-[#4A8FE7]/30 transition-colors disabled:opacity-50">
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>🎯</span>}
                    {locating ? "Detecting..." : "Detect Location"}
                  </button>
                </div>
                {geoError && <p className="text-[10px] text-[#e74c3c] mt-2 text-center">{geoError}</p>}
              </div>
            </div>

            {/* Total Bar */}
            <div className="flex items-center justify-between glass rounded-xl border border-white/10 px-5 py-3 mb-3.5">
              <div><span className="text-[11px] text-[#80949b] block">Order Total</span><span className="text-lg font-extrabold text-white">{formatPrice(total)}</span></div>
              <div className="text-right"><span className="text-xs text-[#2ecc71] font-bold block">🚚 FREE</span><span className="text-[10px] text-[#80949b]">{items.reduce((n,i) => n + i.quantity, 0)} items</span></div>
            </div>
          </>
        )}

        {/* ── STEP 3: PAYMENT ── */}
        {step === 3 && (
          <>
            {/* Delivering To */}
            {selectedAddress && (
              <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                  <span className="text-lg">🏠</span>
                  <div><h2 className="text-sm font-bold text-white">Delivering To</h2><p className="text-[10px] text-[#80949b]">Confirm before you pay</p></div>
                </div>
                <div className="flex items-start justify-between p-5 gap-3">
                  <div className="text-[13px] text-[#c2d0c9] leading-relaxed">
                    <span className="text-[11px] text-[#2ecc71] font-bold uppercase tracking-wider block mb-1">{selectedAddress.label?.toUpperCase() || "HOME"}</span>
                    {currentUser?.name} · {currentUser?.phone}<br />
                    {selectedAddress.building && `${selectedAddress.building}, `}{selectedAddress.street ? `${selectedAddress.street}, ` : ""}{selectedAddress.landmark && `Near ${selectedAddress.landmark}, `}{selectedAddress.city} — {selectedAddress.pincode}
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-[#60a5fa] whitespace-nowrap hover:underline">Change</button>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">💳</span>
                <div><h2 className="text-sm font-bold text-white">Payment Method</h2><p className="text-[10px] text-[#80949b]">Choose how to pay</p></div>
              </div>
              <div className="p-4 space-y-2">
                <button onClick={() => setSelectedPayment("razorpay")} className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${selectedPayment === "razorpay" ? "border-[#2ecc71] bg-[#2ecc71]/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedPayment === "razorpay" ? "bg-[#4A8FE7]/15 text-[#93c5fd]" : "bg-white/5"}`}>⚡</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">Razorpay</span>{selectedPayment === "razorpay" && <span className="product-badge fresh text-[9px]">RECOMMENDED</span>}</div>
                    <p className="text-[11px] text-[#80949b]">UPI · Cards · NetBanking · Wallets</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "razorpay" ? "border-[#2ecc71]" : "border-white/20"}`}>
                    {selectedPayment === "razorpay" && <div className="w-2.5 h-2.5 rounded-full bg-[#2ecc71]" />}
                  </div>
                </button>
                <button onClick={() => setSelectedPayment("cod")} className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${selectedPayment === "cod" ? "border-[#2ecc71] bg-[#2ecc71]/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">💵</div>
                  <div className="flex-1 text-left"><span className="text-sm font-bold text-white">Cash on Delivery</span><p className="text-[11px] text-[#80949b]">Pay the rider when your order arrives</p></div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "cod" ? "border-[#2ecc71]" : "border-white/20"}`}>
                    {selectedPayment === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-[#2ecc71]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="glass rounded-2xl overflow-hidden border border-white/10 mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
                <span className="text-lg">🧾</span>
                <div><h2 className="text-sm font-bold text-white">Bill Summary</h2><p className="text-[10px] text-[#80949b]">Transparent pricing</p></div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-[#80949b]">Subtotal ({items.reduce((n,i) => n + i.quantity, 0)} items)</span><span className="text-white">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-[#80949b]">Delivery</span><span className="text-[#2ecc71] font-semibold">FREE</span></div>
                {saving > 0 && <div className="flex justify-between text-[13px] text-[#2ecc71]"><span>💰 You&apos;re saving</span><span className="font-semibold">{formatPrice(saving)}</span></div>}
                <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-base font-extrabold text-white">Total Payable</span><span className="text-lg font-extrabold text-white">{formatPrice(total)}</span></div>
              </div>
              <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-[11px] text-[#80949b]">
                🔒 Your payment is encrypted and processed securely.
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap mb-4">
              {["🔒 Secure Checkout","🌿 100% Fresh","🚚 Free Delivery"].map((t) => (
                <span key={t} className="text-[10px] font-semibold text-[#80949b] tracking-wider">{t}</span>
              ))}
            </div>
            <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full py-3 rounded-2xl border-2 border-white/10 text-sm font-semibold text-[#80949b] hover:bg-white/5 transition-colors mb-2">← Back to Delivery</button>
          </>
        )}
      </div>

      {/* Sticky Bottom Bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-[#0d1b2a]/95 backdrop-blur-xl px-4 py-3 safe-bottom">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <p className="text-lg font-extrabold text-white tabular-nums">{formatPrice(total)}</p>
            <p className="text-[10px] text-[#80949b]">{items.reduce((n,i) => n + i.quantity, 0)} items</p>
          </div>
          <button onClick={step === 1 ? () => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); } : step === 2 ? () => {
            if (!detailForm.area.trim() || !detailForm.landmark.trim()) { toast.add("Please fill Area and Landmark", "error"); setAddressMissing(true); addressRef.current?.scrollIntoView({ behavior: "smooth" }); setTimeout(() => setAddressMissing(false), 3000); return; }
            if (!selectedAddress) {
              const addr: Address = { id: crypto.randomUUID(), label: addrType === "work" ? "Work" : addrType === "other" ? "Other" : "Home", line1: `${detailForm.building || "N/A"}, ${detailForm.area}`, city: newAddress.city || "Siliguri", pincode: newAddress.pincode || "734001", street: detailForm.street || undefined, area: detailForm.area, landmark: detailForm.landmark, building: detailForm.building || undefined, flat: detailForm.flat || undefined, floor: detailForm.floor || undefined, deliveryInstructions: detailForm.deliveryInstructions || undefined, isDefault: addresses.length === 0, ...(liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : {}) };
              useUserStore.getState().addAddress(addr); setSelectedAddressId(addr.id);
            } else { saveAddressDetails(); }
            setStep(3); window.scrollTo({ top: 0, behavior: "smooth" });
          } : handlePlaceOrder} disabled={step !== 3 ? false : (confirmingOrder || !selectedAddress || !requiredDetailsFilled)} className="rounded-xl py-3 px-6 text-sm font-bold bg-[#2ecc71] text-[#0a1f1c] shadow-lg shadow-[#2ecc71]/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {confirmingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 1 ? "Proceed →" : step === 2 ? "Continue →" : selectedPayment === "razorpay" ? `Pay ₹${total.toLocaleString()}` : "Place Order"}
          </button>
        </div>
      </div>

      {/* UPI Fallback Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-3 pb-6 sm:px-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d1b2a] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <h3 className="text-sm font-bold text-white">Pay via UPI</h3>
              </div>
              <button onClick={() => { setShowUPIModal(false); if (!paymentConfirmed) setSelectedPayment("cod"); }} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition-all">
                <X className="h-4 w-4 text-[#80949b]" />
              </button>
            </div>
            <p className="text-xs text-[#80949b] mb-4">Send the exact amount to the UPI ID below using GPay, PhonePe, or Paytm.</p>
            <div className="rounded-2xl border-2 border-dashed border-[#2ecc71]/30 bg-[#2ecc71]/5 p-5 text-center mb-4">
              <p className="text-[10px] font-medium text-[#80949b] mb-1.5">UPI ID</p>
              <p className="text-sm font-bold text-white tracking-wide">{PAYMENT_UPI_ID}</p>
              <button onClick={() => { navigator.clipboard.writeText(PAYMENT_UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold text-[#2ecc71] hover:bg-[#2ecc71]/10 transition-all">
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy UPI ID"}
              </button>
            </div>
            <div className="rounded-xl bg-[#f39c12]/10 border border-[#f39c12]/20 px-4 py-3 text-center mb-5">
              <p className="text-[10px] text-[#f39c12]">Amount to pay</p>
              <p className="text-xl font-extrabold text-white tabular-nums">{formatPrice(getTotal())}</p>
            </div>
            <button onClick={() => { setPaymentConfirmed(true); setShowUPIModal(false); placeOrder("paid"); }} className="w-full rounded-xl bg-gradient-to-r from-[#1A5C36] to-[#3CB371] py-3 text-sm font-bold text-white shadow-lg shadow-[#2ecc71]/20 hover:opacity-95 transition-all">
              <CheckCircle className="mr-1.5 inline h-4 w-4" /> I&apos;ve Paid — Confirm
            </button>
            <p className="mt-4 text-[10px] text-center text-[#80949b] flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" /> Open GPay / PhonePe / Paytm to complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
