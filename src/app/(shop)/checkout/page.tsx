"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  Navigation,
  Coins,
  Shield,
  Lock,
  AlertTriangle,
  Loader2,
  UserPlus,
  LogIn,
  Smartphone,
  Building2,
  Hash,
  Layers,
  ArrowLeft,
  Package,
  Copy,
  X,
  ExternalLink,
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

const steps = [
  { id: "address", label: "Address", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: CheckCircle },
];

const PAYMENT_UPI_ID = "shubhajit75508@okhdfcbank";

const paymentMethods = [
  { id: "upi", label: "UPI", desc: PAYMENT_UPI_ID, icon: Smartphone },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive", icon: Package },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === current;
        const isDone = i < current;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? "border-brand-fresh bg-brand-fresh text-white"
                    : isActive
                      ? "border-brand-dark bg-brand-dark text-white shadow-lg shadow-brand-dark/20"
                      : "border-gray-200 bg-white text-gray-300"
                }`}
              >
                {isDone ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                {isActive && (
                  <span className="absolute -inset-1 animate-ping rounded-full bg-brand-dark/20" />
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-semibold ${
                  isDone ? "text-brand-fresh" : isActive ? "text-brand-dark" : "text-gray-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1.5 sm:mx-2 h-0.5 w-8 sm:w-20 rounded-full transition-colors duration-300 ${
                i < current ? "bg-brand-fresh" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LocatingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-fresh" />
    </span>
  );
}

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const { location: locationCoords, locating: locationStatus, error: locationErrorMsg, resolvedAddress, getLocation: getLiveLocation } = useGeolocation();
  const [manualPincode, setManualPincode] = useState("");
  const [useManualPincode, setUseManualPincode] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [detailForm, setDetailForm] = useState({ area: "", landmark: "", building: "", flat: "", floor: "" });
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { items, getSubtotal, getTotal, getDeliveryFee, getCoinsDiscount, couponDiscount, clearCart, setCoinsDiscount } = useCartStore();
  const { addresses, user, coinsRedeemed, applyCoinsRedemption, removeCoinsRedemption, earnCoins, redeemCoins } = useUserStore();
  const { currentUser } = useAuthStore();
  const { createOrder } = useOrderStore();
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydrated();

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault) || addresses[0];
  const coinBalance = user?.loyaltyPoints ?? 0;
  const maxRedeemable = Math.floor(coinBalance / 100) * 100;
  const coinsEarned = Math.floor(getTotal() / 100) * 10;

  const isAuthenticated = !!(currentUser && currentUser.role === "customer");
  const hasLocation = !!((selectedAddress?.lat && selectedAddress?.lng) || (useManualPincode && manualPincode.length === 6));
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
      setShowDetailForm(false);
    }
  }, [selectedAddressId]);

  useEffect(() => {
    if (hydrated && isAuthenticated && (!hasLocation || editingLocation) && !locationCoords && !locationStatus) {
      getLiveLocation();
    }
  }, [hydrated, isAuthenticated, hasLocation, editingLocation, getLiveLocation, manualPincode]);

  useEffect(() => {
    if (resolvedAddress && !manualPincode) {
      const match = resolvedAddress.match(/\b\d{6}\b/);
      if (match) {
        setManualPincode(match[0]);
        setUseManualPincode(true);
      }
    }
  }, [resolvedAddress]);

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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted">Add items to get started</p>
        <Button variant="fresh" className="mt-6" onClick={() => router.push("/")}>
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
              <UserPlus className="mr-2 h-4 w-4" /> Create Account
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full rounded-full">
              <LogIn className="mr-2 h-4 w-4" /> Log In
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

  if (hydrated && isAuthenticated && (!hasLocation || editingLocation)) {
    return (
      <div className="mx-auto max-w-sm py-16">
        {editingLocation && (
          <button
            onClick={() => setEditingLocation(false)}
            className="mb-6 flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to checkout
          </button>
        )}

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange/10">
            <MapPin className="h-8 w-8 text-brand-orange" />
          </div>
          <h2 className="text-xl font-extrabold">Delivery Location</h2>
          <p className="mt-1 text-xs text-muted">
            Enter your pincode or allow live location
          </p>

          {locationErrorMsg && (
            <div className="mt-4 rounded-xl bg-brand-red/10 p-3 text-left text-xs text-brand-red">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
              {locationErrorMsg}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border-2 border-border bg-white p-4">
              <label className="text-xs font-semibold text-muted tracking-wide uppercase">Pincode</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="734001"
                value={manualPincode}
                onChange={(e) => { setManualPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setUseManualPincode(true); }}
                className="mt-1.5 w-full text-center text-2xl font-bold tracking-[0.3em] outline-none"
              />
              <p className="mt-1 text-[10px] text-muted">Enter 6-digit pincode</p>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">Also try</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={getLiveLocation}
              disabled={locationStatus}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-brand-fresh/30 bg-brand-fresh/5 px-5 py-3 text-sm font-semibold text-brand-fresh-dim transition-all hover:bg-brand-fresh/10 hover:border-brand-fresh/50 disabled:opacity-60"
            >
              {locationStatus ? (
                <><LocatingDot /> Locating...</>
              ) : (
                <><Smartphone className="h-4 w-4" /> Use Live Location</>
              )}
            </button>

            {locationCoords && (
              <div className="rounded-xl bg-brand-fresh/10 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-fresh-dim">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Location obtained
                </div>
                <p className="mt-0.5 text-[10px] text-muted">
                  {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        </div>
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

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      toast.add("Sign up required to place orders", "error");
      return;
    }
    if (!hasLocation) {
      toast.add("Delivery location is required", "error");
      return;
    }
    if (!selectedAddress) {
      toast.add("Please add a delivery address in your account first", "error");
      return;
    }
    saveAddressDetails();
    if (!requiredDetailsFilled) {
      toast.add("Please fill in Area, Landmark, and Building details", "error");
      setShowDetailForm(true);
      setCurrentStep(0);
      return;
    }

    if (selectedPayment === "upi" && !paymentConfirmed) {
      setShowPaymentModal(true);
      return;
    }

    placeOrder();
  };

  const placeOrder = () => {
    setConfirmingOrder(true);

    const total = getTotal();

    (async () => {
      const orderId = await createOrder({
        items,
        total,
        address: { ...selectedAddress, area: detailForm.area.trim() || selectedAddress.area || undefined, landmark: detailForm.landmark.trim() || selectedAddress.landmark || undefined, building: detailForm.building.trim() || selectedAddress.building || undefined, flat: detailForm.flat.trim() || selectedAddress.flat || undefined, floor: detailForm.floor.trim() || selectedAddress.floor || undefined },
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === "upi" ? "paid" : "unpaid",
        customerName: currentUser?.name ?? "Guest",
        customerPhone: currentUser?.phone ?? "",
        customerEmail: currentUser?.email ?? "",
      });

      if (coinsRedeemed > 0) {
        redeemCoins(coinsRedeemed);
      }
      earnCoins(total);

      clearCart();
      setPaymentConfirmed(false);
      setShowPaymentModal(false);
      const earned = Math.floor(total / 100) * 10;
      toast.add(`Order placed! +${earned} coins earned. Delivery in 30 min - 1 hr.`);
      router.push(`/track/${orderId}`);
    })().catch(() => {
      setConfirmingOrder(false);
      toast.add("Failed to place order. Please try again.", "error");
    });
  };

  const detailProgress = [
    { key: "area", done: !!(detailForm.area.trim()), label: "Area" },
    { key: "landmark", done: !!(detailForm.landmark.trim()), label: "Landmark" },
    { key: "building", done: !!(detailForm.building.trim()), label: "Building" },
    { key: "floor", done: !!(detailForm.floor.trim()), label: "Floor", optional: true },
  ];

  return (
    <div className="px-3 sm:px-0 py-4 sm:py-6 max-w-6xl mx-auto">
      {/* Status bar */}
      <div className="mb-4 sm:mb-5 flex items-center gap-2 rounded-full bg-brand-fresh/10 px-4 sm:px-5 py-2 text-xs font-medium text-brand-fresh-dim shadow-sm">
        <div className={`h-2 w-2 shrink-0 rounded-full ${hasLocation ? "bg-brand-fresh" : "bg-brand-orange animate-pulse"}`} />
        <span className="truncate">{hasLocation ? "Location set" : "Location needed"}</span>
        {hasLocation ? (
          <button onClick={() => setEditingLocation(true)} className="ml-auto shrink-0 rounded-full bg-white px-2.5 sm:px-3 py-1 text-[10px] font-semibold text-brand-fresh-dim shadow-sm hover:bg-brand-fresh/10 transition-colors">
            Change
          </button>
        ) : (
          <CheckCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-brand-fresh" />
        )}
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>

      <div className="mt-6">
        <StepIndicator current={currentStep} />
      </div>

      <div className="mt-6 sm:mt-8 grid gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-2xl p-5 sm:p-6"
            >
              {currentStep === 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold">Delivery Address</h3>
                      <p className="text-xs text-muted mt-0.5">Delivery takes 30 min — 1 hour</p>
                    </div>
                    {!requiredDetailsFilled && (
                      <Badge variant="orange" className="text-[10px]">Details needed</Badge>
                    )}
                  </div>

                  {addresses.length === 0 ? (
                    <div className="rounded-xl bg-surface py-10 text-center">
                      <MapPin className="mx-auto h-8 w-8 text-muted" />
                      <p className="mt-2 text-sm text-muted">No saved addresses.</p>
                      <Link href="/account/addresses">
                        <Button variant="fresh" size="sm" className="mt-3 rounded-full">Add Address</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault);
                        return (
                          <button
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
                              isSelected
                                ? "border-brand-fresh bg-brand-fresh/[0.04]"
                                : "border-border/60 hover:border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-brand-fresh" />
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                isSelected ? "border-brand-fresh bg-brand-fresh" : "border-gray-300"
                              }`}>
                                {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{addr.label}</span>
                                  {addr.isDefault && <Badge variant="fresh" className="text-[10px] px-2 py-0">Default</Badge>}
                                </div>
                                <p className="mt-0.5 text-xs text-muted">{addr.line1}{addr.area ? `, ${addr.area}` : ""}</p>
                                <p className="text-xs text-muted">{addr.city} — {addr.pincode}</p>
                                {addr.landmark && <p className="text-[10px] text-muted mt-0.5">Near {addr.landmark}</p>}
                                {(addr.building || addr.flat || addr.floor) && (
                                  <p className="text-[10px] text-muted">
                                    {[addr.building, addr.flat && `Flat ${addr.flat}`, addr.floor && `Floor ${addr.floor}`].filter(Boolean).join(", ")}
                                  </p>
                                )}
                                {addr.lat && addr.lng && (
                                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-brand-fresh-dim">
                                    <CheckCircle className="h-3 w-3" /> GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {isSelected && showDetailForm && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="mt-4 border-t border-border/40 pt-4"
                              >
                                <p className="text-xs font-semibold text-muted mb-3 flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5" /> Delivery details
                                  <span className="ml-auto flex gap-1.5">
                                    {detailProgress.map((p) => (
                                      <span key={p.key} className={`h-1.5 w-1.5 rounded-full ${p.done ? "bg-brand-fresh" : "bg-gray-200"}`} />
                                    ))}
                                  </span>
                                </p>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-muted mb-1">
                                        <MapPin className="h-3 w-3" /> Area / Locality <span className="text-brand-red">*</span>
                                      </label>
                                      <input
                                        value={detailForm.area}
                                        onChange={(e) => setDetailForm((f) => ({ ...f, area: e.target.value }))}
                                        placeholder="e.g. Salbari, Hakimpara"
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-muted mb-1">
                                        <Navigation className="h-3 w-3" /> Landmark <span className="text-brand-red">*</span>
                                      </label>
                                      <input
                                        value={detailForm.landmark}
                                        onChange={(e) => setDetailForm((f) => ({ ...f, landmark: e.target.value }))}
                                        placeholder="e.g. Near City Centre"
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-muted mb-1">
                                        <Building2 className="h-3 w-3" /> Building / House <span className="text-brand-red">*</span>
                                      </label>
                                      <input
                                        value={detailForm.building}
                                        onChange={(e) => setDetailForm((f) => ({ ...f, building: e.target.value }))}
                                        placeholder="e.g. Green Tower"
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-muted mb-1">
                                        <Hash className="h-3 w-3" /> Flat / Door No.
                                      </label>
                                      <input
                                        value={detailForm.flat}
                                        onChange={(e) => setDetailForm((f) => ({ ...f, flat: e.target.value }))}
                                        placeholder="e.g. 3B"
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="flex items-center gap-1 text-[10px] font-medium text-muted mb-1">
                                        <Layers className="h-3 w-3" /> Floor
                                      </label>
                                      <input
                                        value={detailForm.floor}
                                        onChange={(e) => setDetailForm((f) => ({ ...f, floor: e.target.value }))}
                                        placeholder="e.g. 2nd"
                                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    variant="fresh"
                                    size="sm"
                                    className="rounded-full text-xs"
                                    onClick={() => {
                                      if (!detailForm.area.trim() || !detailForm.landmark.trim() || !detailForm.building.trim()) {
                                        toast.add("Please fill Area, Landmark and Building", "error");
                                        return;
                                      }
                                      saveAddressDetails();
                                      setShowDetailForm(false);
                                      toast.add("Delivery details saved");
                                    }}
                                  >
                                    <CheckCircle className="mr-1 h-3.5 w-3.5" /> Save Details
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedAddress && !showDetailForm && (
                    <button
                      onClick={() => setShowDetailForm(true)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-dark underline underline-offset-2"
                    >
                      <MapPin className="h-3.5 w-3.5" /> {requiredDetailsFilled ? "Edit" : "Add"} delivery details
                    </button>
                  )}
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-bold mb-1">Payment Method</h3>
                  <p className="text-xs text-muted mb-5">Choose how to pay</p>
                  <div className="space-y-2.5">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPayment === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={`relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-brand-fresh bg-brand-fresh/[0.04]"
                              : "border-border/60 hover:border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-brand-fresh" />
                          )}
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? "bg-brand-fresh/10 text-brand-fresh-dim" : "bg-surface text-muted"
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${isSelected ? "text-brand-dark" : ""}`}>{method.label}</p>
                            <p className="text-xs text-muted">{method.desc}</p>
                          </div>
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected ? "border-brand-fresh bg-brand-fresh" : "border-gray-300"
                          }`}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Review Your Order</h3>

                  {/* Address card */}
                  <div className="rounded-2xl border border-border/60 bg-surface/30 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-brand-fresh-dim" />
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">Delivering to</span>
                    </div>
                    <p className="text-sm font-medium">{selectedAddress?.line1}</p>
                    {(detailForm.area.trim() || selectedAddress?.area) && (
                      <p className="text-xs text-muted">Area: {detailForm.area.trim() || selectedAddress?.area}</p>
                    )}
                    {(detailForm.landmark.trim() || selectedAddress?.landmark) && (
                      <p className="text-xs text-muted">Near: {detailForm.landmark.trim() || selectedAddress?.landmark}</p>
                    )}
                    {(detailForm.building.trim() || selectedAddress?.building) && (
                      <p className="text-xs text-muted">
                        {detailForm.building.trim() || selectedAddress?.building}
                        {(detailForm.flat.trim() || selectedAddress?.flat) && `, Flat ${detailForm.flat.trim() || selectedAddress?.flat}`}
                        {(detailForm.floor.trim() || selectedAddress?.floor) && `, Floor ${detailForm.floor.trim() || selectedAddress?.floor}`}
                      </p>
                    )}
                    <p className="text-xs text-muted">{selectedAddress?.city} — {selectedAddress?.pincode}</p>
                    {selectedAddress?.lat && selectedAddress?.lng && (
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-brand-fresh-dim">
                        <CheckCircle className="h-3 w-3" /> GPS verified
                      </p>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2.5 mb-4">
                    {items.map((item) => (
                      <div
                        key={cartLineId(cartLineKey(item))}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-white p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-xs font-bold text-muted">
                          {item.quantity}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-[10px] text-muted">{item.selectedWeight || item.product.unit} · {item.quantity} item{item.quantity > 1 ? "s" : ""}</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coins */}
                  {coinBalance >= 100 && (
                    <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.04] p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange/10">
                            <Coins className="h-4 w-4 text-brand-orange" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Redeem coins</p>
                            <p className="text-[10px] text-muted">You have {coinBalance.toLocaleString()} coins</p>
                          </div>
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
                      {coinsRedeemed > 0 && (
                        <p className="mt-2 text-xs text-muted">
                          {coinsRedeemed} coins applied — saves {formatPrice(getCoinsDiscount())}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment */}
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {selectedPayment === "upi" ? <Smartphone className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                    Payment: {paymentMethods.find((m) => m.id === selectedPayment)?.label}
                  </div>
                  <p className="text-xs text-muted mt-1">Delivery time: 30 min — 1 hour</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="rounded-full flex-1 sm:flex-none"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
              )}
              <span className="text-[10px] text-muted ml-auto sm:ml-0">
                {items.reduce((n, i) => n + i.quantity, 0)} items · {formatPrice(getTotal())}
              </span>
            </div>
            <div className="flex-1 sm:flex-none sm:ml-auto">
              {currentStep < steps.length - 1 ? (
                <Button
                  variant="default"
                  className="rounded-full w-full sm:w-auto px-6"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 0 && (!selectedAddress || !requiredDetailsFilled)}
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="fresh"
                  className="rounded-full w-full sm:w-auto px-6"
                  onClick={handlePlaceOrder}
                  disabled={confirmingOrder || (currentStep === steps.length - 1 && !!selectedAddress && !requiredDetailsFilled)}
                >
                  {confirmingOrder ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Place Order — {formatPrice(getTotal())}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="glass-card h-fit rounded-2xl p-5 sm:p-6">
          <h3 className="font-bold text-sm">Order Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
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
              <span className="text-brand-fresh font-medium">
                {getDeliveryFee() === 0 ? "FREE" : formatPrice(getDeliveryFee())}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-bold">
              <span>Total</span>
              <span className="text-brand-dark">{formatPrice(getTotal())}</span>
            </div>
            {coinsEarned > 0 && (
              <p className="pt-1 text-[10px] text-brand-fresh text-center">
                +{coinsEarned} coins earned
              </p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs text-muted">
              <Shield className="h-3.5 w-3.5 text-brand-fresh" />
              {user?.name ?? currentUser?.name ?? "Guest"}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 text-brand-fresh" />
              {hasLocation ? "Location set" : "Location required"}
            </div>
          </div>
          <div className="mt-4">
            <ReturnPolicyBanner />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-3 pb-6 sm:px-0"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Pay via UPI</h3>
                <button onClick={() => { setShowPaymentModal(false); if (!paymentConfirmed) setSelectedPayment("cod"); }} className="rounded-full p-1 hover:bg-gray-100">
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
                onClick={() => { setPaymentConfirmed(true); setShowPaymentModal(false); placeOrder(); }}
                className="w-full rounded-full bg-brand-fresh py-3 text-sm font-bold text-white hover:bg-brand-fresh-dim transition-colors"
              >
                <CheckCircle className="mr-1.5 inline h-4 w-4" /> I&apos;ve Paid — Confirm
              </button>

              <p className="mt-3 text-[10px] text-center text-muted">
                <ExternalLink className="mr-0.5 inline h-3 w-3" /> Open GPay / PhonePe / Paytm and pay now
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}