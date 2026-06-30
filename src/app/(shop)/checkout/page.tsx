"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Copy, X, ExternalLink, Loader2,
  ShoppingCart, Receipt, User, Home, Building2, Pin, Leaf, Zap, Banknote, CreditCard, Smartphone,
  Crosshair, Lock, AlertTriangle, Clock, Lightbulb, Map, Truck, FileText, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, cartLineId, cartLineKey } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { useCouponStore } from "@/store/coupon-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { formatPrice, getWeightMultiplier, getPriceForWeight } from "@/lib/utils";
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
  const { items, getSubtotal, getTotal, getDeliveryFee, couponDiscount, clearCart, updateQuantity, removeItem, applyCoupon: applyCartCoupon, removeCoupon } = useCartStore();
  const { addresses, user } = useUserStore();
  const { currentUser } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { coupons } = useCouponStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"razorpay" | "cod">("razorpay");
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upiTxnId, setUpiTxnId] = useState("");
  const [detailForm, setDetailForm] = useState({ area: "", landmark: "", building: "", flat: "", floor: "", street: "", deliveryInstructions: "" });
  const [addressMissing, setAddressMissing] = useState(false);
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [contactForm, setContactForm] = useState({ name: currentUser?.name || "", phone: currentUser?.phone || "", email: currentUser?.email || "" });
  const addressRef = useRef<HTMLDivElement>(null);

  const { locating, error: geoError, location, getLocation } = useGeolocation();

  const [newAddress, setNewAddress] = useState({
    city: "Siliguri",
    pincode: "734001",
  });
  const [addrType, setAddrType] = useState("home");
  const [editingAddress, setEditingAddress] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const requiredDetailsFilled = !!(detailForm.area?.trim() && detailForm.street?.trim() && detailForm.building?.trim());

  if (hydrated && items.length === 0 && !paymentConfirmed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-20 text-center">
        <ShoppingCart className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted">Add items to get started</p>
        <Button className="mt-6 rounded-full bg-[#2D7D3A] hover:bg-[#23682E] text-white font-bold" onClick={() => router.push("/")}>Continue Shopping</Button>
      </div>
    );
  }

  if (hydrated && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Lock className="h-12 w-12 mb-4" />
          <h2 className="text-2xl font-extrabold text-foreground">Sign Up Required</h2>
          <p className="mt-2 text-sm text-muted">Create an account to place orders.</p>
          <div className="mt-6 space-y-3">
            <Link href="/auth/signup"><Button className="w-full rounded-xl bg-[#2D7D3A] hover:bg-[#23682E] text-white font-bold py-3">Create Account</Button></Link>
            <Link href="/auth/login"><Button variant="outline" className="w-full rounded-xl py-3">Log In</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const total = getTotal();

  const saveAddressDetails = () => {
    if (!selectedAddressId) return;
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) return;
    const updated = {
      ...addr,
      building: detailForm.building || addr.building,
      flat: detailForm.flat || addr.flat,
      floor: detailForm.floor || addr.floor,
      street: detailForm.street || addr.street,
      area: detailForm.area || addr.area,
      landmark: detailForm.landmark || addr.landmark,
      deliveryInstructions: detailForm.deliveryInstructions || addr.deliveryInstructions,
    };
    useUserStore.getState().updateAddress(updated);
  };

  const handlePlaceOrder = async () => {
    setConfirmingOrder(true);
    try {
      await placeOrder("cod");
    } catch {
      toast.add("Order failed. Please try again.", "error");
    } finally {
      setConfirmingOrder(false);
    }
  };

  const placeOrder = async (paymentStatus: string) => {
    if (!selectedAddress) {
      toast.add("Please select a delivery address", "error");
      setAddressMissing(true);
      addressRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setAddressMissing(false), 3000);
      return;
    }
    if (!currentUser) {
      toast.add("Please sign in first", "error");
      return;
    }

    const razorpayLoaded = await loadRazorpayScript();
    if (paymentStatus === "razorpay" && !razorpayLoaded) {
      setShowUPIModal(true);
      return;
    }

    if (paymentStatus === "razorpay" && razorpayLoaded) {
      try {
        const orderId = await createOrder({
          items: items.map(i => ({ ...i })),
          total: total,
          address: selectedAddress,
          paymentMethod: "razorpay",
          paymentStatus: "paid",
          customerName: currentUser.name,
          customerPhone: currentUser.phone || "",
          customerEmail: currentUser.email || "",
          userId: currentUser.id,
        });

        if (!orderId) throw new Error("Order creation failed");

        const Rzpay = (window as any).Razorpay;
        const rzp = new Rzpay({
          key: "rzp_test_T3eebwyzkSd5mE",
          amount: Math.round(total * 100),
          currency: "INR",
          name: "Siliguri Fresh Mart",
          description: "Fresh Market Delivery",
          prefill: {
            name: currentUser.name,
            email: currentUser.email,
            contact: currentUser.phone,
          },
          theme: { color: "#2D7D3A" },
          handler: () => {
            setPaymentConfirmed(true);
            clearCart();
            router.push(`/track/${orderId}`);
          },
          modal: { ondismiss: () => toast.add("Payment cancelled", "info") },
        });
        rzp.open();
      } catch {
        toast.add("Payment failed. Please try again.", "error");
      }
      return;
    }

    const orderId = await createOrder({
      items: items.map(i => ({ ...i })),
      total: total,
      address: selectedAddress,
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      customerName: currentUser.name,
      customerPhone: currentUser.phone || "",
      customerEmail: currentUser.email || "",
      userId: currentUser.id,
    });

    if (orderId) {
      setPaymentConfirmed(true);
      clearCart();
      router.push(`/track/${orderId}`);
    } else {
      toast.add("Order failed. Please try again.", "error");
    }
  };

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
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">Siliguri Fresh Mart</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2D7D3A] mt-0.5">From Market to Your Home</p>
          </div>
          <div className="rounded-full bg-[#2D7D3A]/8 border border-[#2D7D3A]/30 px-3.5 py-1.5 text-[11px] font-bold text-[#2D7D3A] tracking-wider">
            Step {step} of 3
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8">
          {[ {n:1,l:"Cart"},{n:2,l:"Delivery"},{n:3,l:"Payment"} ].map((s,i) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border flex-shrink-0 ${
                  step > s.n ? "bg-[#2D7D3A] border-[#2D7D3A] text-white" : step === s.n ? "bg-[#2D7D3A]/10 border-[#2D7D3A] text-[#2D7D3A]" : "bg-surface-2 border-border text-muted"
                }`}>
                  {step > s.n ? "\u2713" : s.n}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider hidden sm:inline ${step >= s.n ? "text-foreground" : "text-muted"}`}>{s.l}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-1.5 ${step > s.n ? "bg-[#2D7D3A]/40" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: CART ── */}
        {step === 1 && (
          <>
            {/* Cart Items */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <ShoppingCart className="h-5 w-5" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Your Cart</h2>
                  <p className="text-[10px] text-muted">Review before checkout</p>
                </div>
                <div className="ml-auto rounded-full bg-[#2D7D3A]/8 border border-[#2D7D3A]/20 px-3 py-1 text-[10px] font-bold text-[#2D7D3A]">
                  {items.reduce((n,i) => n + i.quantity, 0)} items
                </div>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const lineKey = cartLineKey(item);
                  const b = catBadge(item.product.category);
                  return (
                    <div key={cartLineId(lineKey)} className="group flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors relative">
                      <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                        {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Package className="h-6 w-6 text-muted" />
                      )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-foreground truncate">{item.product.name}</span>
                          {b && <span className={`product-badge ${b.cls}`}>{b.label}</span>}
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">
                          {item.selectedWeight || item.product.unit}
                          {item.selectedCut ? ` \u00b7 Cut: ${item.selectedCut}` : ""}
                          {item.selectedCleaning ? ` \u00b7 Clean: ${item.selectedCleaning}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-light mt-1">
                          {item.product.originalPrice && item.product.originalPrice > item.product.price ? (
                            <>MRP <span className="line-through">\u20B9{item.product.originalPrice}</span> &nbsp;</>
                          ) : null}
                          <span className="text-[#2D7D3A] font-bold">\u20B9{item.product.price}/unit</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-extrabold text-foreground">\u20B9{(getPriceForWeight(item.product.price, item.selectedWeight || item.product.unit, item.product.weightPrices) * item.quantity).toFixed(0)}</span>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0 rounded-lg bg-surface-2 border border-border">
                          <button onClick={() => { const k = cartLineKey(item); if (item.quantity <= 1) removeItem(k); else updateQuantity(k, item.quantity - 1); }} className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground rounded-l-lg text-sm font-bold">\u2212</button>
                          <span className="min-w-[28px] text-center text-[13px] font-bold text-foreground">{item.quantity}</span>
                          <button onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground rounded-r-lg text-sm font-bold">+</button>
                        </div>
                          <button onClick={() => removeItem(cartLineKey(item))} className="w-6 h-6 rounded-md bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-[10px] text-brand-red hover:bg-brand-red/20 transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Receipt className="h-5 w-5" />
                <h2 className="text-sm font-bold text-foreground">Bill Summary</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Subtotal ({items.reduce((n,i) => n + i.quantity, 0)} items)</span><span className="text-foreground font-semibold">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted">Delivery</span><span className="text-[#2D7D3A] font-semibold">FREE</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-[13px] text-[#2D7D3A]"><span>Coupon</span><span className="font-semibold">-{formatPrice(couponDiscount)}</span></div>}
                <div className="border-t border-border pt-3 flex justify-between"><span className="text-[15px] font-extrabold text-foreground">Total</span><span className="text-lg font-extrabold text-foreground">{formatPrice(total)}</span></div>
              </div>
              <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-[#2D7D3A]/5 border border-[#2D7D3A]/10 px-4 py-2.5 text-[11px] text-muted">
                <Clock className="h-4 w-4" /> Estimated delivery <strong className="text-foreground mx-1">within 45\u201360 min</strong> after order confirmation.
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {["Secure Checkout","100% Fresh","Free Delivery"].map((t) => (
                <span key={t} className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1">
                  {t === "Secure Checkout" ? <Lock className="h-3 w-3" /> : t === "100% Fresh" ? <Leaf className="h-3 w-3" /> : <Truck className="h-3 w-3" />}{t}
                </span>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 2: DELIVERY ── */}
        {step === 2 && (
          <>
            {/* Contact */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <User className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Contact</h2><p className="text-[10px] text-muted">So we can reach you</p></div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Full Name <span className="text-brand-red text-xs">*</span></label>
                  <input type="text" value={contactForm.name} onChange={(e) => setContactForm(c => ({ ...c, name: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="Rajan Sharma" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Phone <span className="text-brand-red text-xs">*</span></label>
                  <div className="flex"><div className="bg-[#2D7D3A]/5 border border-border border-r-0 rounded-l-xl px-3 py-2.5 text-xs font-bold text-[#2D7D3A] whitespace-nowrap flex items-center gap-1">{'\uD83C\uDDEE\uD83C\uDDF3'} +91</div><input type="tel" value={contactForm.phone} onChange={(e) => setContactForm(c => ({ ...c, phone: e.target.value }))} className="flex-1 bg-white border border-border rounded-r-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="98765 43210" /></div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Email <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <input type="email" value={contactForm.email} onChange={(e) => setContactForm(c => ({ ...c, email: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="you@example.com" />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div ref={addressRef} className={`card-white overflow-hidden mb-3.5 transition-all duration-500 ${addressMissing ? "border-brand-red/50 ring-2 ring-[#e74c3c]/20 address-shake" : ""}`}>
              {addressMissing && (
                <div className="flex items-center gap-2 bg-brand-red/10 border-b border-brand-red/20 px-4 py-2.5"><AlertTriangle className="h-5 w-5" /><span className="text-xs font-bold text-brand-red">Address required \u2014 please fill delivery details</span></div>
              )}
              {(!selectedAddress || editingAddress) ? (
                <>
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Home className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Delivery Address</h2><p className="text-[10px] text-muted">Where should we deliver?</p></div>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">House / Flat <span className="text-brand-red text-xs">*</span></label>
                  <input value={detailForm.building} onChange={(e) => setDetailForm(f => ({ ...f, building: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="12B, Ground Floor" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Building <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <input value={detailForm.flat} onChange={(e) => setDetailForm(f => ({ ...f, flat: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="Green Valley Apts" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Street / Road <span className="text-brand-red text-xs">*</span></label>
                  <input value={detailForm.street} onChange={(e) => setDetailForm(f => ({ ...f, street: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="Sevoke Road, Near City Centre" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Area <span className="text-brand-red text-xs">*</span></label>
                  <input value={detailForm.area} onChange={(e) => setDetailForm(f => ({ ...f, area: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="Hakimpara, Pradhan Nagar..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Pincode <span className="text-brand-red text-xs">*</span></label>
                  <input value={newAddress.pincode} onChange={(e) => setNewAddress(f => ({ ...f, pincode: e.target.value }))} maxLength={6} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="734001" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Landmark <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <input value={detailForm.landmark} onChange={(e) => setDetailForm(f => ({ ...f, landmark: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="Opposite SBI Bank" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">City <span className="text-brand-red text-xs">*</span></label>
                  <input value={newAddress.city} onChange={(e) => setNewAddress(f => ({ ...f, city: e.target.value }))} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="Siliguri" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">Delivery Note <span className="product-badge fresh ml-1 text-[8px]">optional</span></label>
                  <textarea value={detailForm.deliveryInstructions} onChange={(e) => setDetailForm(f => ({ ...f, deliveryInstructions: e.target.value }))} rows={2} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10 resize-none" placeholder="Ring bell twice \u00b7 Leave at door..." />
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="h-px bg-border my-2" />
                <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-2 block">Address Type</label>
                <div className="flex gap-2 flex-wrap">
                  {[{ label:"Home", icon: Home },{ label:"Work", icon: Building2 },{ label:"Other", icon: Pin }].map((t) => {
                    const val = t.label.toLowerCase();
                    const Icon = t.icon;
                    return (
                      <button key={val} onClick={() => setAddrType(val)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          addrType === val ? "bg-[#2D7D3A]/8 border-[#2D7D3A]/40 text-[#2D7D3A]" : "bg-surface-2 border-border text-muted hover:bg-surface"
                        }`}
                      ><Icon className="h-3.5 w-3.5" />{t.label}</button>
                    );
                  })}
                </div>
              </div>
              {selectedAddress && (
                <div className="px-5 pb-5">
                  <button onClick={() => { saveAddressDetails(); setEditingAddress(false); }} className="w-full py-2.5 rounded-xl bg-[#2D7D3A]/8 border border-[#2D7D3A]/20 text-[#2D7D3A] text-xs font-bold hover:bg-[#2D7D3A]/15 transition-colors">
                    \u2713 Done Editing
                  </button>
                </div>
              )}
                </>
              ) : (
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Home className="h-6 w-6" />
                      <div>
                        <h2 className="text-sm font-bold text-foreground">Delivery Address</h2>
                        <p className="text-[10px] text-[#2D7D3A] font-bold uppercase tracking-wider mt-0.5">{selectedAddress?.label?.toUpperCase() || "HOME"}</p>
                      </div>
                    </div>
                    <button onClick={() => { setEditingAddress(true); setAddressMissing(false); }} className="text-xs font-bold text-[#2D7D3A] hover:underline">Edit</button>
                  </div>
                  {selectedAddress && (
                    <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-foreground leading-relaxed">
                      {selectedAddress.building && <span>{selectedAddress.building}{selectedAddress.flat ? `, Flat ${selectedAddress.flat}` : ""}{selectedAddress.floor ? `, Floor ${selectedAddress.floor}` : ""}</span>}
                      {selectedAddress.street && <span>{selectedAddress.building ? ", " : ""}{selectedAddress.street}</span>}
                      {(selectedAddress.building || selectedAddress.street) && <br />}
                      {selectedAddress.area && <span>{selectedAddress.area}</span>}
                      {selectedAddress.landmark && <span>, Near {selectedAddress.landmark}</span>}
                      <br />
                      <span>{selectedAddress.city} \u2014 {selectedAddress.pincode}</span>
                      {selectedAddress.deliveryInstructions && <p className="text-[11px] text-muted mt-1 italic">{selectedAddress.deliveryInstructions}</p>}
                      {selectedAddress.lat && selectedAddress.lng && <p className="text-[10px] text-[#2D7D3A] mt-1">GPS coordinates saved</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pin Your Location */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Pin className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Pin Your Location</h2><p className="text-[10px] text-muted">Helps our rider reach you exactly</p></div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 rounded-xl bg-[#4A8FE7]/5 border border-[#4A8FE7]/20 px-4 py-2.5 text-[11px] text-muted mb-4"><Lightbulb className="h-4 w-4" /> Tap <strong className="text-foreground mx-0.5">Detect</strong> to auto-locate or click anywhere on the map.</div>
                <div className="w-full h-48 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-3">
                  {location ? (
                    <div className="text-center">
                      <Pin className="h-8 w-8" />
                      <p className="text-xs text-[#2D7D3A] mt-2 font-semibold">GPS Location Saved</p>
                      <p className="text-[10px] text-muted mt-1">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                    </div>
                  ) : (
                    <div className="text-center opacity-60"><Map className="h-8 w-8" /><p className="text-xs text-muted mt-2">Tap Detect to pin your location</p></div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={getLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4A8FE7]/10 border border-[#4A8FE7]/30 text-[#4A8FE7] text-xs font-bold hover:bg-[#4A8FE7]/20 transition-colors disabled:opacity-50">
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                    {locating ? "Detecting..." : "Detect Location"}
                  </button>
                </div>
                {geoError && <p className="text-[10px] text-brand-red mt-2 text-center">{geoError}</p>}
              </div>
            </div>

            {/* Total Bar */}
            <div className="flex items-center justify-between card-white px-5 py-3 mb-3.5">
              <div><span className="text-[11px] text-muted block">Order Total</span><span className="text-lg font-extrabold text-foreground">{formatPrice(total)}</span></div>
              <div className="text-right"><span className="text-xs text-[#2D7D3A] font-bold block">FREE</span><span className="text-[10px] text-muted">{items.reduce((n,i) => n + i.quantity, 0)} items</span></div>
            </div>
          </>
        )}

        {/* ── STEP 3: PAYMENT ── */}
        {step === 3 && (
          <>
            {/* Delivering To */}
            {selectedAddress && (
              <div className="card-white overflow-hidden mb-3.5">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                  <Home className="h-5 w-5" />
                  <div><h2 className="text-sm font-bold text-foreground">Delivering To</h2><p className="text-[10px] text-muted">Confirm before you pay</p></div>
                </div>
                <div className="flex items-start justify-between p-5 gap-3">
                  <div className="text-[13px] text-muted leading-relaxed">
                    <span className="text-[11px] text-[#2D7D3A] font-bold uppercase tracking-wider block mb-1">{selectedAddress.label?.toUpperCase() || "HOME"}</span>
                    {currentUser?.name} \u00b7 {currentUser?.phone}<br />
                    {selectedAddress.building && `${selectedAddress.building}, `}{selectedAddress.street ? `${selectedAddress.street}, ` : ""}{selectedAddress.landmark && `Near ${selectedAddress.landmark}, `}{selectedAddress.city} \u2014 {selectedAddress.pincode}
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-[#2D7D3A] whitespace-nowrap hover:underline">Change</button>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <CreditCard className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Payment Method</h2><p className="text-[10px] text-muted">Choose how to pay</p></div>
              </div>
              <div className="p-4 space-y-2">
                <button onClick={() => setSelectedPayment("razorpay")} className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${selectedPayment === "razorpay" ? "border-[#2D7D3A] bg-[#2D7D3A]/5" : "border-border bg-surface-2 hover:border-[#2D7D3A]/30"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedPayment === "razorpay" ? "bg-[#4A8FE7]/10 text-[#4A8FE7]" : "bg-surface"}`}><Zap className="h-5 w-5" /></div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-foreground">Razorpay</span>{selectedPayment === "razorpay" && <span className="product-badge fresh text-[9px]">RECOMMENDED</span>}</div>
                    <p className="text-[11px] text-muted">UPI \u00b7 Cards \u00b7 NetBanking \u00b7 Wallets</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "razorpay" ? "border-[#2D7D3A]" : "border-border"}`}>
                    {selectedPayment === "razorpay" && <div className="w-2.5 h-2.5 rounded-full bg-[#2D7D3A]" />}
                  </div>
                </button>
                <button onClick={() => setSelectedPayment("cod")} className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${selectedPayment === "cod" ? "border-[#2D7D3A] bg-[#2D7D3A]/5" : "border-border bg-surface-2 hover:border-[#2D7D3A]/30"}`}>
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-lg"><Banknote className="h-5 w-5" /></div>
                  <div className="flex-1 text-left"><span className="text-sm font-bold text-foreground">Cash on Delivery</span><p className="text-[11px] text-muted">Pay the rider when your order arrives</p></div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "cod" ? "border-[#2D7D3A]" : "border-border"}`}>
                    {selectedPayment === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-[#2D7D3A]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Receipt className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Bill Summary</h2><p className="text-[10px] text-muted">Transparent pricing</p></div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Subtotal ({items.reduce((n,i) => n + i.quantity, 0)} items)</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted">Delivery</span><span className="text-[#2D7D3A] font-semibold">FREE</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-[13px] text-[#2D7D3A]"><span>Coupon</span><span className="font-semibold">-{formatPrice(couponDiscount)}</span></div>}
                <div className="border-t border-border pt-3 flex justify-between"><span className="text-base font-extrabold text-foreground">Total Payable</span><span className="text-lg font-extrabold text-foreground">{formatPrice(total)}</span></div>
              </div>
              <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-surface-2 border border-border px-4 py-2.5 text-[11px] text-muted">
                Your payment is encrypted and processed securely.
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap mb-4">
              {["Secure Checkout","100% Fresh","Free Delivery"].map((t) => (
                <span key={t} className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1">
                  {t === "Secure Checkout" ? <Lock className="h-3 w-3" /> : t === "100% Fresh" ? <Leaf className="h-3 w-3" /> : <Truck className="h-3 w-3" />}{t}
                </span>
              ))}
            </div>
            <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-muted hover:bg-surface-2 transition-colors mb-2">{'\u2190'} Back to Delivery</button>
          </>
        )}
      </div>

      {/* Sticky Bottom Bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-sm px-4 py-3 safe-bottom shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <p className="text-lg font-extrabold text-foreground tabular-nums">{formatPrice(total)}</p>
            <p className="text-[10px] text-muted">{items.reduce((n,i) => n + i.quantity, 0)} items</p>
          </div>
          <button onClick={step === 1 ? () => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); } : step === 2 ? () => {
            if (!detailForm.area.trim() || !detailForm.landmark.trim()) { toast.add("Please fill Area and Landmark", "error"); setAddressMissing(true); addressRef.current?.scrollIntoView({ behavior: "smooth" }); setTimeout(() => setAddressMissing(false), 3000); return; }
            if (!selectedAddress) {
              const addr: Address = { id: crypto.randomUUID(), label: addrType === "work" ? "Work" : addrType === "other" ? "Other" : "Home", line1: `${detailForm.building || "N/A"}, ${detailForm.area}`, city: newAddress.city || "Siliguri", pincode: newAddress.pincode || "734001", street: detailForm.street || undefined, area: detailForm.area, landmark: detailForm.landmark, building: detailForm.building || undefined, flat: detailForm.flat || undefined, floor: detailForm.floor || undefined, deliveryInstructions: detailForm.deliveryInstructions || undefined, isDefault: addresses.length === 0, ...(location ? { lat: location.lat, lng: location.lng } : {}) };
              useUserStore.getState().addAddress(addr); setSelectedAddressId(addr.id);
            } else { saveAddressDetails(); }
            setEditingAddress(false);
            setStep(3); window.scrollTo({ top: 0, behavior: "smooth" });
          } : handlePlaceOrder} disabled={step !== 3 ? false : (confirmingOrder || !selectedAddress || !requiredDetailsFilled)} className="rounded-xl py-3 px-6 text-sm font-bold bg-[#2D7D3A] text-white shadow-lg shadow-[#2D7D3A]/20 hover:bg-[#23682E] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {confirmingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 1 ? "Proceed \u2192" : step === 2 ? "Continue \u2192" : selectedPayment === "razorpay" ? `Pay \u20B9${total.toLocaleString()}` : "Place Order"}
          </button>
        </div>
      </div>

      {/* UPI Fallback Modal */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-3 pb-6 sm:px-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                <h3 className="text-sm font-bold text-foreground">Pay via UPI</h3>
              </div>
              <button onClick={() => { setShowUPIModal(false); if (!paymentConfirmed) setSelectedPayment("cod"); }} className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-surface-2 transition-all">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <p className="text-xs text-muted mb-4">Send the exact amount to the UPI ID below using GPay, PhonePe, or Paytm.</p>
            <div className="rounded-2xl border-2 border-dashed border-[#2D7D3A]/30 bg-[#2D7D3A]/5 p-5 text-center mb-4">
              <p className="text-[10px] font-medium text-muted mb-1.5">UPI ID</p>
              <p className="text-sm font-bold text-foreground tracking-wide">{PAYMENT_UPI_ID}</p>
              <button onClick={() => { navigator.clipboard.writeText(PAYMENT_UPI_ID); setCopied(true); setTimeout(() => setCopied(false), 2500); }} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#2D7D3A]/30 px-3 py-1 text-[10px] font-semibold text-[#2D7D3A] hover:bg-[#2D7D3A]/10 transition-all">
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy UPI ID"}
              </button>
            </div>
            <div className="rounded-xl bg-brand-orange/10 border border-[#f39c12]/20 px-4 py-3 text-center mb-4">
              <p className="text-[10px] text-brand-orange">Amount to pay</p>
              <p className="text-xl font-extrabold text-foreground tabular-nums">{formatPrice(getTotal())}</p>
            </div>
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted mb-1.5 block">UPI Reference ID <span className="text-brand-red text-xs">*</span></label>
              <input
                type="text"
                value={upiTxnId}
                onChange={(e) => setUpiTxnId(e.target.value)}
                placeholder="Paste UPI reference from your app"
                className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10"
              />
            </div>
            <button
              onClick={() => { setPaymentConfirmed(true); setShowUPIModal(false); placeOrder("paid"); }}
              disabled={!upiTxnId.trim()}
              className="w-full rounded-xl bg-[#2D7D3A] py-3 text-sm font-bold text-white shadow-lg shadow-[#2D7D3A]/20 hover:bg-[#23682E] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle className="mr-1.5 inline h-4 w-4" /> I&apos;ve Paid \u2014 Confirm
            </button>
            <p className="mt-4 text-[10px] text-center text-muted flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" /> Open GPay / PhonePe / Paytm to complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
