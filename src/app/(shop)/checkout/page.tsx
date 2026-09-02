"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X, Loader2,
  ShoppingCart, Receipt, User, Home, Building2, Pin, Leaf, Zap, Banknote, CreditCard,
  Crosshair, Lock, AlertTriangle, Clock, Lightbulb, Map, Truck, Package, Tag, CheckCircle2,
  HelpCircle, Phone as PhoneIcon, ChevronDown, ChevronUp,
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
import { fbq } from "@/components/analytics/meta-pixel";
import type { Address } from "@/types";
import { DELIVERY_RADIUS_KM, distanceFromStore, isWithinDeliveryZone, getDeliveryTier, getMinOrderForDistance, DELIVERY_SLOTS, getCurrentSlot, getNextSlot, type DeliverySlot } from "@/lib/delivery-zone";
import PaymentScreen from "@/components/payment/PaymentScreen";

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydrated();
  const { items, getSubtotal, getTotal, getDeliveryFee, getMinOrder, getEta, couponDiscount, clearCart, updateQuantity, removeItem, applyCoupon: applyCartCoupon, removeCoupon, setDistance } = useCartStore();
  const { addresses, user } = useUserStore();
  const { currentUser } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { coupons } = useCouponStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"upi" | "cod">("cod");
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [detailForm, setDetailForm] = useState({ area: "", landmark: "", building: "", flat: "", floor: "", street: "", deliveryInstructions: "" });
  const [addressMissing, setAddressMissing] = useState(false);
  const [step, setStep] = useState(2);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  // Contact info is remembered on this device so a returning customer doesn't
  // have to retype it. Order of precedence: logged-in user profile > saved prefs.
  const [contactForm, setContactForm] = useState(() => {
    let saved: { name?: string; phone?: string; email?: string } = {};
    try {
      const raw = window.localStorage.getItem("sfm-checkout-contact");
      if (raw) saved = JSON.parse(raw) as { name?: string; phone?: string; email?: string };
    } catch { saved = {}; }
    return {
      name: currentUser?.name || saved.name || "",
      phone: (currentUser?.phone || saved.phone || "").replace(/\D/g, ""),
      email: currentUser?.email || saved.email || "",
    };
  });
  const addressRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  const { locating, error: geoError, location, getLocation } = useGeolocation();
  const [showHelp, setShowHelp] = useState(false);

  // Auto-show help when GPS fails
  useEffect(() => {
    if (geoError) setShowHelp(true);
  }, [geoError]);

  const [newAddress, setNewAddress] = useState({
    city: "Siliguri",
    pincode: "734001",
  });
  const [addrType, setAddrType] = useState("home");
  const [editingAddress, setEditingAddress] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  // Delivery needs a locality (area) + valid pincode. Street/building/landmark are optional.
  const requiredDetailsFilled = !!(detailForm.area?.trim() && /^\d{6}$/.test(newAddress.pincode?.trim() || ""));
  const hasSavedCoords = !!(selectedAddress?.lat && selectedAddress?.lng);
  const deliveryFee = getDeliveryFee();

  // The customer's pinned GPS location is authoritative for the delivery zone
  // check — it overrides any stale coords stored on a saved address.
  const effectiveAddress: Address | undefined = selectedAddress
    ? location
      ? { ...selectedAddress, lat: location.lat, lng: location.lng }
      : selectedAddress
    : undefined;

  // If the customer's GPS comes through after the checkout screen rendered,
  // it just upgrades the zone check — no dialog blocks the order.
  const pinnedDistance = location ? distanceFromStore(location.lat, location.lng) : null;
  const pinnedInZone = !!location && pinnedDistance !== null && isWithinDeliveryZone(location.lat, location.lng);

  // Slot auto-assigned by distance: 8-15km → Morning, 15-20km → Afternoon, ≤8km → none
  const deliverySlot: DeliverySlot | null = pinnedDistance !== null && pinnedDistance > 8
    ? pinnedDistance <= 15
      ? DELIVERY_SLOTS[0] // Morning: 11 AM–12 PM
      : DELIVERY_SLOTS[1] // Afternoon: 1 PM–3 PM
    : null;

  // Sync distance to cart store for delivery fee calculation
  useEffect(() => {
    if (pinnedDistance !== null) {
      setDistance(pinnedDistance);
    }
  }, [pinnedDistance, setDistance]);

  // Remember the phone/email/name typed on this device so it's prefilled next
  // time — it stays until the customer changes it themselves.
  useEffect(() => {
    const name = contactForm.name.trim();
    const phone = contactForm.phone.replace(/\D/g, "");
    const email = contactForm.email.trim();
    if (!name && !phone && !email) {
      try { window.localStorage.removeItem("sfm-checkout-contact"); } catch {}
      return;
    }
    try {
      window.localStorage.setItem("sfm-checkout-contact", JSON.stringify({ name, phone, email }));
    } catch {}
  }, [contactForm.name, contactForm.phone, contactForm.email]);

  // Auto-select saved address on mount and pre-populate form
  useEffect(() => {
    if (!hydrated || selectedAddressId) return;
    const savedAddresses = useUserStore.getState().addresses;
    if (savedAddresses.length === 0) return;

    // Pick default address, or the first one
    const addr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
    setSelectedAddressId(addr.id);
    setEditingAddress(false);
    setAddrType(addr.label?.toLowerCase() || "home");
    setNewAddress({ city: addr.city || "Siliguri", pincode: addr.pincode || "734001" });
    setDetailForm({
      area: addr.area || "",
      landmark: addr.landmark || "",
      building: addr.building || "",
      flat: addr.flat || "",
      floor: addr.floor || "",
      street: addr.street || "",
      deliveryInstructions: addr.deliveryInstructions || "",
    });
  }, [hydrated, addresses]);

  useEffect(() => {
    if (hydrated && items.length > 0) {
      fbq("InitiateCheckout", {
        value: getTotal(),
        currency: "INR",
        num_items: items.length,
      });
    }
  }, [hydrated]);

  // If the customer is returning from their UPI app (after a page reload), restore
  // the in-progress payment screen instead of dropping them back on the checkout form.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sfm-pending-payment");
      if (!raw) return;
      const pending = JSON.parse(raw) as { orderId?: string; total?: number };
      if (!pending?.orderId) return;
      if (Math.abs(Number(pending.total) - total) < 1 && items.length > 0) {
        setShowPaymentScreen(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const subtotal = getSubtotal();
  const total = getTotal();
  const minOrder = getMinOrder();
  const eta = getEta();
  const minOrderShortfall = minOrder > 0 && subtotal < minOrder ? minOrder - subtotal : 0;

  // Auto-save GPS coords to the selected address when detected, so next
  // order automatically has the location without re-detecting.
  useEffect(() => {
    if (!location || !selectedAddressId) return;
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) return;
    if (Number(addr.lat) === location.lat && Number(addr.lng) === location.lng) return;
    useUserStore.getState().updateAddress({ ...addr, lat: location.lat, lng: location.lng });
  }, [location?.lat, location?.lng, selectedAddressId]);

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
      // Also persist fresh GPS if available
      ...(location ? { lat: location.lat, lng: location.lng } : {}),
    };
    useUserStore.getState().updateAddress(updated);
  };

  const placeOrder = async () => {
    if (confirmingOrder) return;
    if (!selectedAddress) {
      toast.add("Please select a delivery address", "error");
      setAddressMissing(true);
      addressRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setAddressMissing(false), 3000);
      return;
    }
    const name = contactForm.name.trim();
    const phone = contactForm.phone.replace(/\D/g, "");
    if (!name) {
      toast.add("Please enter your name", "error");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      toast.add("Please enter a valid 10-digit phone number", "error");
      return;
    }

    // GPS location is mandatory — order cannot proceed without it
    // But allow if the selected address already has GPS coordinates from a previous session
    const hasExistingCoords = selectedAddress?.lat && selectedAddress?.lng;
    if (!location && !hasExistingCoords) {
      toast.add("Please detect your location to continue. It's required for delivery.", "error");
      pinRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const zoneLat = Number(location?.lat ?? selectedAddress?.lat);
    const zoneLng = Number(location?.lng ?? selectedAddress?.lng);
    const hasCoords = Number.isFinite(zoneLat) && Number.isFinite(zoneLng) && zoneLat !== 0 && zoneLng !== 0;
    if (hasCoords && !isWithinDeliveryZone(zoneLat, zoneLng)) {
      toast.add(`Sorry, we deliver within ${DELIVERY_RADIUS_KM} km of our hub at NJP Gate Bazar, Siliguri`, "error");
      pinRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (selectedPayment === "cod") {
      setConfirmingOrder(true);
      try {
        const orderId = await createOrder({
          items: items.map(i => ({ ...i })),
          total: total,
          subtotal,
          deliveryFee,
          couponDiscount,
          address: effectiveAddress!,
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          customerName: name,
          customerPhone: phone,
          customerEmail: contactForm.email.trim() || currentUser?.email || "",
          userId: currentUser?.id,
          deliverySlot: deliverySlot?.id || undefined,
          deliveryWindow: deliverySlot?.deliveryWindow || undefined,
        });
        if (orderId) {
          setPaymentConfirmed(true);
          clearCart();
          router.push(`/order-success?id=${orderId}`);
        } else {
          toast.add("Order failed. Please try again.", "error");
        }
      } catch (e) {
        toast.add(e instanceof Error ? e.message : "Order failed. Please try again.", "error");
      } finally {
        setConfirmingOrder(false);
      }
    } else {
      // Show the branded payment screen for UPI
      setShowPaymentScreen(true);
    }
  };

  const handlePlaceOrder = () => placeOrder();

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

  const handlePaymentSuccess = (orderId: string) => {
    useOrderStore.getState().addLocalOrder({
      id: orderId,
      items: items.map(i => ({ ...i })),
      status: "received",
      total,
      createdAt: new Date().toISOString(),
      address: effectiveAddress!,
      eta: 60,
      customerName: contactForm.name.trim() || currentUser?.name || "Guest",
      customerPhone: contactForm.phone.replace(/\D/g, "") || currentUser?.phone || "",
      customerEmail: contactForm.email.trim() || currentUser?.email || "",
      paymentMethod: "upi",
      paymentStatus: "unpaid",
      deliveryStatus: "pending",
    });
    setShowPaymentScreen(false);
    setPaymentConfirmed(true);
    clearCart();
    router.push(`/order-success?id=${orderId}`);
  };

  const handlePaymentCancel = () => {
    setShowPaymentScreen(false);
  };

  const catBadge = (cat: string) => {
    if (["fish","chicken","mutton","pork","seafood"].includes(cat)) return { label:"FRESH", cls:"fresh" };
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
                  {step > s.n ? "✓" : s.n}
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
                          {item.selectedCut ? ` · Cut: ${item.selectedCut}` : ""}
                          {item.selectedCleaning ? ` · Clean: ${item.selectedCleaning}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-light mt-1">
                          {item.product.originalPrice && item.product.originalPrice > item.product.price ? (
                            <>MRP <span className="line-through">₹{item.product.originalPrice}</span> &nbsp;</>
                          ) : null}
                          <span className="text-[#2D7D3A] font-bold">₹{item.product.price}/unit</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-extrabold text-foreground">₹{(getPriceForWeight(item.product.price, item.selectedWeight || item.product.unit, item.product.weightPrices) * item.quantity).toFixed(0)}</span>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0 rounded-lg bg-surface-2 border border-border">
                          <button onClick={() => { const k = cartLineKey(item); if (item.quantity <= 1) removeItem(k); else updateQuantity(k, item.quantity - 1); }} className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground rounded-l-lg text-sm font-bold">−</button>
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
                <div className="flex justify-between text-[13px]"><span className="text-muted">Delivery</span><span className={deliveryFee === 0 ? "text-[#2D7D3A] font-semibold" : "text-foreground font-semibold"}>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-[13px] text-[#2D7D3A]"><span>Coupon</span><span className="font-semibold">-{formatPrice(couponDiscount)}</span></div>}
                <div className="border-t border-border pt-3 flex justify-between"><span className="text-[15px] font-extrabold text-foreground">Total</span><span className="text-lg font-extrabold text-foreground">{formatPrice(total)}</span></div>
              </div>
              <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-[#2D7D3A]/5 border border-[#2D7D3A]/10 px-4 py-2.5 text-[11px] text-muted">
                <Clock className="h-4 w-4" /> Estimated delivery <strong className="text-foreground mx-1">
                  {deliverySlot ? `${deliverySlot.deliveryWindow} (order before ${deliverySlot.orderBefore})` : `within ${eta}`}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {["Secure Checkout","100% Fresh","20 km Delivery Area"].map((t) => (
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
                  <div className="flex"><div className="bg-[#2D7D3A]/5 border border-border border-r-0 rounded-l-xl px-3 py-2.5 text-xs font-bold text-[#2D7D3A] whitespace-nowrap flex items-center gap-1">🇮🇳 +91</div><input type="tel" value={contactForm.phone} onChange={(e) => { let digits = e.target.value.replace(/\D/g, ""); if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2); setContactForm(c => ({ ...c, phone: digits.slice(0, 10) })); }} className="flex-1 bg-white border border-border rounded-r-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10" placeholder="98765 43210" /></div>
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
                <div className="flex items-center gap-2 bg-brand-red/10 border-b border-brand-red/20 px-4 py-2.5"><AlertTriangle className="h-5 w-5" /><span className="text-xs font-bold text-brand-red">Address required — please fill delivery details</span></div>
              )}
              {/* Saved addresses picker */}
              {!editingAddress && addresses.length > 1 && (
                <div className="px-5 pt-4 pb-2 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted">Saved Addresses</p>
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setEditingAddress(false);
                        setAddrType(addr.label?.toLowerCase() || "home");
                        setNewAddress({ city: addr.city || "Siliguri", pincode: addr.pincode || "734001" });
                        setDetailForm({
                          area: addr.area || "",
                          landmark: addr.landmark || "",
                          building: addr.building || "",
                          flat: addr.flat || "",
                          floor: addr.floor || "",
                          street: addr.street || "",
                          deliveryInstructions: addr.deliveryInstructions || "",
                        });
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${
                        selectedAddressId === addr.id
                          ? "border-[#2D7D3A] bg-[#2D7D3A]/5"
                          : "border-border hover:border-[#2D7D3A]/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#2D7D3A] uppercase tracking-wider">{addr.label || "Home"}</span>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? "border-[#2D7D3A]" : "border-border"}`}>
                          {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-[#2D7D3A]" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 truncate">
                        {[addr.building, addr.street, addr.area].filter(Boolean).join(", ")}, {addr.city} — {addr.pincode}
                      </p>
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedAddressId(null); setEditingAddress(true); }}
                    className="w-full rounded-xl border border-dashed border-border py-2 text-[11px] font-semibold text-muted hover:border-[#2D7D3A]/40 hover:text-[#2D7D3A] transition-colors"
                  >
                    + Add New Address
                  </button>
                  <div className="h-px bg-border my-1" />
                </div>
              )}

              {(!selectedAddress || editingAddress) ? (
                <>
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Home className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Delivery Address</h2><p className="text-[10px] text-muted">{addresses.length > 0 ? "Edit your address" : "Where should we deliver?"}</p></div>
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
                  <textarea value={detailForm.deliveryInstructions} onChange={(e) => setDetailForm(f => ({ ...f, deliveryInstructions: e.target.value }))} rows={2} className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10 resize-none" placeholder="Ring bell twice · Leave at door..." />
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
                    ✓ Done Editing
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
                      <span>{selectedAddress.city} — {selectedAddress.pincode}</span>
                      {selectedAddress.deliveryInstructions && <p className="text-[11px] text-muted mt-1 italic">{selectedAddress.deliveryInstructions}</p>}
                      {selectedAddress.lat && selectedAddress.lng && <p className="text-[10px] text-[#2D7D3A] mt-1">GPS coordinates saved</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pin Your Location — MANDATORY */}
            <div ref={pinRef} className={`card-white overflow-hidden mb-3.5 ${!location ? "border-amber-400/60 ring-2 ring-amber-400/20" : ""}`}>
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Pin className="h-5 w-5" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Pin Your Location <span className="text-brand-red text-xs">*</span>
                  </h2>
                  <p className="text-[10px] text-muted">Required — we deliver within {DELIVERY_RADIUS_KM} km of NJP Gate Bazar</p>
                </div>
                {!location && !hasSavedCoords && <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 px-2 py-1 rounded-full">Required</span>}
                {hasSavedCoords && !location && <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-[#2D7D3A]/10 text-[#2D7D3A] px-2 py-1 rounded-full">Using Saved GPS</span>}
              </div>
              <div className="p-5">
                {!location && !hasSavedCoords && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-[11px] text-amber-700 mb-4">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Please tap <strong>Detect Location</strong> below. Your location is required to calculate delivery time and verify we can reach you.</span>
                  </div>
                )}
                {hasSavedCoords && !location && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#2D7D3A]/5 border border-[#2D7D3A]/20 px-4 py-2.5 text-[11px] text-[#2D7D3A] mb-4">
                    <Pin className="h-4 w-4 flex-shrink-0" />
                    <span>Using GPS from your saved address. <button onClick={getLocation} className="font-bold underline">Re-detect</button> for current location.</span>
                  </div>
                )}
                <div className="w-full h-48 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-3">
                  {location ? (
                    <div className="text-center">
                      <Pin className="h-8 w-8" />
                      <p className="text-xs text-[#2D7D3A] mt-2 font-semibold">GPS Location Saved</p>
                      <p className="text-[10px] text-muted mt-1">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                      {pinnedDistance !== null && (
                        <div className="mt-2 space-y-1">
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold ${pinnedInZone ? "bg-[#2D7D3A]/10 text-[#2D7D3A]" : "bg-brand-red/10 text-brand-red"}`}>
                            {pinnedInZone ? "✓" : "✗"} {pinnedDistance.toFixed(1)} km from hub — {pinnedInZone ? "inside delivery area" : `outside ${DELIVERY_RADIUS_KM} km area`}
                          </div>
                          {pinnedInZone && (
                            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 ml-1">
                              <Clock className="h-3 w-3" /> {deliverySlot ? `Delivery: ${deliverySlot.deliveryWindow}` : `Est. delivery: ${eta}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center opacity-60"><Map className="h-8 w-8" /><p className="text-xs text-muted mt-2">Tap Detect to pin your location</p></div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={getLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4A8FE7]/10 border border-[#4A8FE7]/30 text-[#4A8FE7] text-xs font-bold hover:bg-[#4A8FE7]/20 transition-colors disabled:opacity-50">
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                    {locating ? "Detecting..." : location ? "Re-detect Location" : "Detect Location"}
                  </button>
                </div>
                {!location && !hasSavedCoords && !locating && (
                  <div className="mt-3">
                    <p className="text-[10px] text-brand-red text-center mb-2">{geoError || "Location not detected. Please check your phone settings below, or order via WhatsApp/call."}</p>
                    <button onClick={() => setShowHelp(!showHelp)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-2 border border-border text-xs font-semibold text-muted hover:text-foreground transition-colors">
                      <HelpCircle className="h-3.5 w-3.5" /> Need help enabling location? {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showHelp && (
                      <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-4 text-[11px] text-blue-800 space-y-3">
                        <p className="font-bold text-blue-900">How to enable location on your phone:</p>
                        <div>
                          <p className="font-semibold">Android (Chrome):</p>
                          <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                            <li>Open phone <strong>Settings</strong></li>
                            <li>Tap <strong>Apps</strong> → <strong>Chrome</strong> (or your browser)</li>
                            <li>Tap <strong>Permissions</strong> → <strong>Location</strong></li>
                            <li>Select <strong>Allow all the time</strong> or <strong>Allow while using</strong></li>
                          </ol>
                        </div>
                        <div>
                          <p className="font-semibold">iPhone (Safari):</p>
                          <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                            <li>Open phone <strong>Settings</strong></li>
                            <li>Tap <strong>Privacy & Security</strong> → <strong>Location Services</strong></li>
                            <li>Find <strong>Safari</strong> (or your browser)</li>
                            <li>Select <strong>While Using the App</strong></li>
                          </ol>
                        </div>
                        <button onClick={getLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4A8FE7] text-white text-xs font-bold hover:bg-[#3a7ad4] transition-colors disabled:opacity-50 mt-2">
                          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                          {locating ? "Detecting..." : "Try Detecting Again"}
                        </button>
                        <div className="border-t border-blue-200 pt-3">
                          <p className="font-bold text-blue-900">Still struggling? Order via WhatsApp or call us:</p>
                          <div className="mt-2 space-y-1.5">
                            <a href="https://wa.me/917029908278?text=Hi!%20I%20can%27t%20share%20my%20location.%20I%20want%20to%20place%20an%20order." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#25D366] font-bold hover:underline">
                              <svg viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.054 9.374L1.054 31.25l6.098-1.97A15.906 15.906 0 0016.004 32C24.83 32 32 24.822 32 16S24.83 0 16.004 0zm9.308 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.84.18-1.938.324-5.636-1.21-4.736-1.966-7.78-6.81-8.016-7.126-.226-.316-1.896-2.524-1.896-4.814s1.2-3.41 1.63-3.878c.39-.424.936-.572 1.248-.572.152 0 .29.008.416.014.434.018.65.044.936.716.35.84 1.198 2.924 1.302 3.138.104.214.214.52.064.834-.138.326-.258.526-.472.814-.214.288-.42.512-.634.822-.194.276-.41.572-.17.996.238.424 1.06 1.75 2.274 2.836 1.562 1.396 2.838 1.83 3.288 2.036.336.154.734.092.994-.276.332-.468.74-1.236 1.15-1.982.294-.534.666-.6 1.132-.404.378.158 2.398 1.132 2.81 1.338.414.206.69.31.794.484.104.174.104 1.006-.286 2.106z"/></svg>
                              Order on WhatsApp
                            </a>
                            <a href="tel:+917029908278" className="flex items-center gap-2 font-bold text-foreground hover:text-[#2D7D3A]">
                              <PhoneIcon className="h-3.5 w-3.5" /> Call: +91 7029908278
                            </a>
                            <a href="tel:+919832966112" className="flex items-center gap-2 font-bold text-foreground hover:text-[#2D7D3A]">
                              <PhoneIcon className="h-3.5 w-3.5" /> Call: +91 9832966112
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Minimum Order Warning */}
            {minOrderShortfall > 0 && (
              <div className="mb-3.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-[11px] text-amber-700">
                  Add <strong>{formatPrice(minOrderShortfall)}</strong> more to meet the {formatPrice(minOrder)} minimum for your area (delivery fee will be waived).
                </p>
              </div>
            )}

            {/* Delivery Slot Info — auto-assigned by distance, 8km+ only */}
            {deliverySlot && pinnedDistance !== null && (
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Clock className="h-5 w-5" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Your Delivery Slot</h2>
                  <p className="text-[10px] text-muted">Auto-assigned based on your location ({pinnedDistance.toFixed(1)} km from hub)</p>
                </div>
              </div>
              <div className="p-5">
                <div className={`rounded-xl border-2 px-4 py-3 ${
                  deliverySlot.id === "morning"
                    ? "border-blue-300 bg-blue-50"
                    : "border-amber-300 bg-amber-50"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{deliverySlot.label}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      deliverySlot.id === "morning"
                        ? "bg-blue-200 text-blue-700"
                        : "bg-amber-200 text-amber-700"
                    }`}>
                      {deliverySlot.id === "morning" ? "8-15 km" : "15-20 km"}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 font-semibold ${
                    deliverySlot.id === "morning" ? "text-blue-700" : "text-amber-700"
                  }`}>
                    Order before {deliverySlot.orderBefore} → Delivered <strong>{deliverySlot.deliveryWindow}</strong>
                  </p>
                </div>
                <p className="text-[10px] text-muted text-center mt-2">
                  Your slot is automatically assigned based on your distance from NJP Gate Bazar
                </p>
              </div>
            </div>
            )}

            {/* Total Bar */}
            <div className="flex items-center justify-between card-white px-5 py-3 mb-3.5">
              <div><span className="text-[11px] text-muted block">Order Total</span><span className="text-lg font-extrabold text-foreground">{formatPrice(total)}</span></div>
              <div className="text-right"><span className="text-xs text-[#2D7D3A] font-bold block">{deliveryFee === 0 ? "FREE" : `+ ${formatPrice(deliveryFee)} delivery`}</span><span className="text-[10px] text-muted">{items.reduce((n,i) => n + i.quantity, 0)} items</span></div>
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
                    {currentUser?.name || "Guest"} · {currentUser?.phone || (contactForm.phone ? `+91 ${contactForm.phone}` : "—")}<br />
                    {selectedAddress.building && `${selectedAddress.building}, `}{selectedAddress.street ? `${selectedAddress.street}, ` : ""}{selectedAddress.landmark && `Near ${selectedAddress.landmark}, `}{selectedAddress.city} — {selectedAddress.pincode}
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
                <button onClick={() => setSelectedPayment("upi")} className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${selectedPayment === "upi" ? "border-[#2D7D3A] bg-[#2D7D3A]/5" : "border-border bg-surface-2 hover:border-[#2D7D3A]/30"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedPayment === "upi" ? "bg-[#2D7D3A]/10 text-[#2D7D3A]" : "bg-surface"}`}><Zap className="h-5 w-5" /></div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-foreground">Online Payment (UPI)</span></div>
                    <p className="text-[11px] text-muted">Google Pay · PhonePe · Paytm · BHIM</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "upi" ? "border-[#2D7D3A]" : "border-border"}`}>
                    {selectedPayment === "upi" && <div className="w-2.5 h-2.5 rounded-full bg-[#2D7D3A]" />}
                  </div>
                </button>
                <button onClick={() => setSelectedPayment("cod")} className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${selectedPayment === "cod" ? "border-[#2D7D3A] bg-[#2D7D3A]/5" : "border-border bg-surface-2 hover:border-[#2D7D3A]/30"}`}>
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-lg"><Banknote className="h-5 w-5" /></div>
                  <div className="flex-1 text-left"><span className="text-sm font-bold text-foreground">Cash on Delivery</span>{selectedPayment === "cod" && <span className="ml-2 product-badge fresh text-[9px]">RECOMMENDED</span>}<p className="text-[11px] text-muted">Pay the rider when your order arrives</p></div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === "cod" ? "border-[#2D7D3A]" : "border-border"}`}>
                    {selectedPayment === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-[#2D7D3A]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Coupon */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Tag className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Coupon / Promo</h2><p className="text-[10px] text-muted">Apply a code to save on this order</p></div>
              </div>
              <div className="flex gap-2 p-4">
                <input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponMsg(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(); }}
                  className="flex-1 bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-[#2D7D3A]/50 focus:ring-2 focus:ring-[#2D7D3A]/10 uppercase tracking-wider"
                  maxLength={20}
                />
                <button
                  onClick={couponDiscount > 0 ? removeCoupon : handleApplyCoupon}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${couponDiscount > 0 ? "bg-brand-red/10 border border-brand-red/25 text-brand-red hover:bg-brand-red/20" : "bg-[#2D7D3A]/10 border border-[#2D7D3A]/30 text-[#2D7D3A] hover:bg-[#2D7D3A]/20"}`}
                >
                  {couponDiscount > 0 ? "Remove" : "Apply"}
                </button>
              </div>
              {couponMsg && (
                <div className={`px-5 pb-3 text-[11px] font-semibold ${couponMsg.ok ? "text-[#2D7D3A]" : "text-brand-red"}`}>
                  {couponMsg.ok ? <CheckCircle2 className="h-3 w-3 inline mr-1" /> : <AlertTriangle className="h-3 w-3 inline mr-1" />}{couponMsg.text}
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="card-white overflow-hidden mb-3.5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
                <Receipt className="h-5 w-5" />
                <div><h2 className="text-sm font-bold text-foreground">Bill Summary</h2><p className="text-[10px] text-muted">Transparent pricing</p></div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-muted">Subtotal ({items.reduce((n,i) => n + i.quantity, 0)} items)</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted">Delivery</span><span className={deliveryFee === 0 ? "text-[#2D7D3A] font-semibold" : "text-foreground font-semibold"}>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-[13px] text-[#2D7D3A]"><span>Coupon</span><span className="font-semibold">-{formatPrice(couponDiscount)}</span></div>}
                <div className="border-t border-border pt-3 flex justify-between"><span className="text-base font-extrabold text-foreground">Total Payable</span><span className="text-lg font-extrabold text-foreground">{formatPrice(total)}</span></div>
              </div>
              <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-surface-2 border border-border px-4 py-2.5 text-[11px] text-muted">
                Your payment is encrypted and processed securely.
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap mb-4">
              {["Secure Checkout","100% Fresh","20 km Delivery Area"].map((t) => (
                <span key={t} className="text-[10px] font-semibold text-muted tracking-wider flex items-center gap-1">
                  {t === "Secure Checkout" ? <Lock className="h-3 w-3" /> : t === "100% Fresh" ? <Leaf className="h-3 w-3" /> : <Truck className="h-3 w-3" />}{t}
                </span>
              ))}
            </div>
            <button onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-muted hover:bg-surface-2 transition-colors mb-2">{'←'} Back to Delivery</button>
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
            if (!selectedAddress && (!detailForm.area.trim() || !/^\d{6}$/.test(newAddress.pincode.trim()))) { toast.add("Please fill Area and a valid 6-digit Pincode", "error"); setAddressMissing(true); addressRef.current?.scrollIntoView({ behavior: "smooth" }); setTimeout(() => setAddressMissing(false), 3000); return; }
            if (!selectedAddress) {
              const addr: Address = { id: crypto.randomUUID(), label: addrType === "work" ? "Work" : addrType === "other" ? "Other" : "Home", line1: `${detailForm.building || "N/A"}, ${detailForm.area}`, city: newAddress.city || "Siliguri", pincode: newAddress.pincode || "734001", street: detailForm.street || undefined, area: detailForm.area, landmark: detailForm.landmark, building: detailForm.building || undefined, flat: detailForm.flat || undefined, floor: detailForm.floor || undefined, deliveryInstructions: detailForm.deliveryInstructions || undefined, isDefault: addresses.length === 0, ...(location ? { lat: location.lat, lng: location.lng } : {}) };
              useUserStore.getState().addAddress(addr); setSelectedAddressId(addr.id);
              setEditingAddress(false);
              if (!location && !(addr.lat && addr.lng)) {
                toast.add("Please detect your location to continue. It's required for delivery.", "error");
                pinRef.current?.scrollIntoView({ behavior: "smooth" });
                return;
              }
              setStep(3); window.scrollTo({ top: 0, behavior: "smooth" });
            } else { saveAddressDetails(); setEditingAddress(false); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }
          } : handlePlaceOrder} disabled={step !== 3 ? false : (confirmingOrder || !selectedAddress || !requiredDetailsFilled || (!location && !(selectedAddress?.lat && selectedAddress?.lng)))} className="rounded-xl py-3 px-6 text-sm font-bold bg-[#2D7D3A] text-white shadow-lg shadow-[#2D7D3A]/20 hover:bg-[#23682E] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {confirmingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 1 ? "Proceed →" : step === 2 ? "Continue →" : selectedPayment === "upi" ? `Pay ₹${total.toLocaleString()}` : "Place Order"}
          </button>
        </div>
      </div>

      {/* Premium UPI Payment Screen */}
      {showPaymentScreen && selectedAddress && effectiveAddress && (
        <PaymentScreen
          items={items.map(i => ({ ...i }))}
          total={total}
          address={effectiveAddress}
          customerName={contactForm.name.trim() || currentUser?.name || "Guest"}
          customerPhone={contactForm.phone.replace(/\D/g, "") || currentUser?.phone || ""}
          customerEmail={contactForm.email.trim() || currentUser?.email || ""}
          userId={currentUser?.id}
          couponDiscount={couponDiscount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
