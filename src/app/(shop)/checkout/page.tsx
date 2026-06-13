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

const steps = [
  { id: "address", label: "Address", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: CheckCircle },
];

const paymentMethods = [
  { id: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Credit/Debit Card", desc: "Visa, Mastercard, RuPay" },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive" },
];

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const { location: locationCoords, locating: locationStatus, error: locationErrorMsg, resolvedAddress, getLocation: getLiveLocation } = useGeolocation();
  const [manualPincode, setManualPincode] = useState("");
  const [useManualPincode, setUseManualPincode] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
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
  const hasLocation = !!(locationCoords || (selectedAddress?.lat && selectedAddress?.lng) || (useManualPincode && manualPincode.length === 6));

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
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Button variant="fresh" className="mt-4" onClick={() => router.push("/")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (hydrated && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10">
          <Shield className="h-10 w-10 text-brand-red" />
        </div>
        <h2 className="text-2xl font-extrabold">Sign Up Required</h2>
        <p className="mt-2 text-sm text-muted">
          You must create an account and verify your identity before placing an order.
        </p>
        <div className="mt-6 space-y-3">
          <Link href="/auth/signup">
            <Button variant="default" className="w-full">
              <UserPlus className="mr-2 h-4 w-4" /> Create Account
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
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

  if (hydrated && isAuthenticated && !hasLocation) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/10">
          <MapPin className="h-10 w-10 text-brand-orange" />
        </div>
        <h2 className="text-2xl font-extrabold">Delivery Location Required</h2>
        <p className="mt-2 text-sm text-muted">
          Enter your delivery pincode or enable live location for accurate delivery.
        </p>
        {locationErrorMsg && (
          <div className="mt-4 rounded-xl bg-brand-red/10 p-4 text-left text-sm text-brand-red">
            <AlertTriangle className="mr-1 inline h-4 w-4" />
            {locationErrorMsg}
          </div>
        )}
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <label className="text-xs font-medium text-muted">Delivery Pincode</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="734001"
              value={manualPincode}
              onChange={(e) => { setManualPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setUseManualPincode(true); }}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-center font-bold tracking-widest outline-none focus:border-brand-dark"
            />
            <p className="mt-1 text-xs text-muted">Enter 6-digit pincode</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="default"
            className="w-full"
            onClick={getLiveLocation}
            disabled={locationStatus}
          >
            {locationStatus ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locating...</>
            ) : (
              <><Smartphone className="mr-2 h-4 w-4" /> Use Live Location</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      toast.add("Sign up required to place orders", "error");
      return;
    }
    if (!hasLocation) {
      toast.add("Live location is required", "error");
      return;
    }

    setConfirmingOrder(true);

    const total = getTotal();
    if (coinsRedeemed > 0) {
      redeemCoins(coinsRedeemed);
    }
    earnCoins(total);

    (async () => {
      const orderId = await createOrder({
        items,
        total,
        address: selectedAddress ?? addresses.find((a) => a.isDefault) ?? addresses[0],
        paymentMethod: selectedPayment,
        customerName: currentUser?.name ?? "Guest",
        customerPhone: currentUser?.phone ?? "",
        customerEmail: currentUser?.email ?? "",
      });

      clearCart();
      const earned = Math.floor(total / 100) * 10;
      toast.add(`Order placed! +${earned} coins earned. Delivery in 30 min - 1 hr.`);
      router.push(`/track/${orderId}`);
    })();
  };

  return (
    <div className="py-6">
      {/* Security badge */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-fresh/10 px-4 py-2 text-xs font-medium text-brand-fresh-dim">
        <Shield className="h-3.5 w-3.5" />
        Verified account · {hasLocation ? "Delivery location set" : "Delivery location needed"}
        {hasLocation && <CheckCircle className="ml-auto h-3.5 w-3.5 text-brand-fresh" />}
      </div>

      <h1 className="text-2xl font-extrabold">Checkout</h1>

      {/* Steps indicator */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <button
              key={step.id}
              onClick={() => i <= currentStep && setCurrentStep(i)}
              className="flex items-center gap-2 shrink-0"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-brand-dark text-white"
                    : isDone
                      ? "bg-brand-fresh text-white"
                      : "bg-brand-dark/5 text-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  isActive ? "text-brand-dark" : "text-muted"
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="mx-1 h-4 w-4 text-muted" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Step content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-2xl p-6"
            >
              {currentStep === 0 && (
                <div>
                  <h3 className="text-lg font-bold">Delivery Address</h3>
                  <p className="mt-1 text-sm text-muted">Delivery takes 30 min — 1 hour</p>
                  {addresses.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">
                      No saved addresses.{" "}
                      <a href="/account/addresses" className="text-brand-dark font-semibold underline">
                        Add one
                      </a>
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault)
                              ? "border-brand-dark bg-brand-dark/5"
                              : "border-brand-dark/10 hover:border-brand-dark/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{addr.label}</span>
                            {addr.isDefault && <Badge variant="fresh">Default</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            {addr.line1}
                            {addr.line2 && `, ${addr.line2}`}
                          </p>
                          <p className="text-sm text-muted">
                            {addr.city} — {addr.pincode}
                          </p>
                          {addr.lat && addr.lng && (
                            <p className="mt-1 text-xs text-muted flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              Live location set
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-bold">Payment Method</h3>
                  <div className="mt-4 space-y-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                          selectedPayment === method.id
                            ? "border-brand-dark bg-brand-dark/5"
                            : "border-brand-dark/10 hover:border-brand-dark/20"
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">{method.label}</p>
                          <p className="text-xs text-muted">{method.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-bold">Review Your Order</h3>
                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <div
                        key={cartLineId(cartLineKey(item))}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.product.price * getWeightMultiplier(item.selectedWeight) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coins section */}
                  {coinBalance >= 100 && (
                    <div className="mt-4 rounded-xl border border-brand-orange/20 bg-brand-orange/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-brand-orange" />
                          <span className="text-sm font-medium">Use your coins</span>
                        </div>
                        <button
                          onClick={handleToggleCoins}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            coinsRedeemed > 0
                              ? "bg-brand-red/10 text-brand-red"
                              : "bg-brand-fresh/10 text-brand-fresh-dim hover:bg-brand-fresh/20"
                          }`}
                        >
                          {coinsRedeemed > 0 ? "Remove" : "Apply coins"}
                        </button>
                      </div>
                      {coinsRedeemed > 0 ? (
                        <p className="mt-1 text-xs text-muted">
                          {coinsRedeemed} coins applied — saves {formatPrice(getCoinsDiscount())}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted">
                          You have {coinBalance.toLocaleString()} coins — get up to {formatPrice(Math.min(maxRedeemable, 500) / 100 * 50)} off
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 border-t pt-4 text-sm text-muted space-y-1">
                    <p>Delivering to: {selectedAddress ? selectedAddress.line1 : "No address set"}</p>
                    <p>Delivery time: 30 min — 1 hour</p>
                    <p>
                      Payment:{" "}
                      {paymentMethods.find((m) => m.id === selectedPayment)?.label}
                    </p>
                    {locationCoords && (
                      <p className="flex items-center gap-1 text-brand-fresh">
                        <CheckCircle className="h-3 w-3" />
                        Live location verified
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="fresh"
                className="flex-1"
                onClick={handlePlaceOrder}
                disabled={confirmingOrder}
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

        {/* Order summary sidebar */}
        <div className="glass-card h-fit rounded-2xl p-6">
          <h3 className="font-bold">Order Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">
                Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)
              </span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-brand-fresh">
                <span>Coupon</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            {getCoinsDiscount() > 0 && (
              <div className="flex justify-between text-brand-orange">
                <span>Coins</span>
                <span>-{formatPrice(getCoinsDiscount())}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span className="text-brand-fresh">
                {getDeliveryFee() === 0 ? "FREE" : formatPrice(getDeliveryFee())}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-brand-dark">{formatPrice(getTotal())}</span>
            </div>
            {coinsEarned > 0 && (
              <p className="pt-1 text-xs text-brand-fresh text-center">
                +{coinsEarned} coins earned on this order
              </p>
            )}
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
              <Shield className="h-3 w-3 text-brand-fresh" />
              {user?.name ?? currentUser?.name ?? "Guest"}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
              <MapPin className="h-3 w-3 text-brand-fresh" />
              {hasLocation ? "Location on" : "Location required"}
            </div>
          </div>
          <div className="mt-4">
            <ReturnPolicyBanner />
          </div>
        </div>
      </div>
    </div>
  );
}
