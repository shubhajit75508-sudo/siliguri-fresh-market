"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/ui/toaster";
import { useUserStore } from "@/store/user-store";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { MapPin, Loader2, UserPlus, Shield, Truck, ShoppingBag } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, login, adminExists } = useAuthStore();
  const { setUser, addAddress } = useUserStore();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    role: "customer" as "admin" | "delivery" | "customer",
  });
  const { location, locating, error: locationError, resolvedAddress, getLocation: getLiveLocation } = useGeolocation();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdminOptions, setShowAdminOptions] = useState(false);

  useEffect(() => {
    if (resolvedAddress && !form.address) {
      setForm((prev) => ({ ...prev, address: resolvedAddress }));
      toast.add("Address filled from live location");
    }
  }, [resolvedAddress]);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "admin" || role === "delivery") {
      setShowAdminOptions(true);
      setForm((prev) => ({ ...prev, role }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!form.phone.trim()) { setError("Phone is required"); return; }
    if (form.password.length < 4) { setError("Password must be at least 4 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!form.address.trim()) { setError("Address is required"); return; }

    setSubmitting(true);
    const result = await signup({
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone,
      address: form.address,
      role: form.role,
      location,
    });

    if (result.success) {
      if (form.address) {
        addAddress({
          id: "addr-" + crypto.randomUUID().slice(0, 8),
          label: "Home",
          line1: form.address,
          city: "",
          pincode: "",
          lat: location?.lat,
          lng: location?.lng,
          isDefault: true,
        });
      }
      if (form.role === "customer") {
        const loginResult = await login(form.email, form.password);
        if (loginResult.success) {
          setUser({
            id: "user-" + form.phone,
            name: form.name,
            email: form.email,
            phone: "+91 " + form.phone,
            loyaltyPoints: 0,
          });
          toast.add("Welcome! Account created and signed in.");
          router.push("/");
        }
      } else {
        toast.add("Account created! Please sign in.");
        router.push("/auth/login");
      }
    } else {
      setError(result.error ?? "Signup failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-md py-10 px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10">
          <UserPlus className="h-7 w-7 text-brand-dark" />
        </div>
        <h1 className="text-2xl font-extrabold">Create Account</h1>
        <p className="mt-1 text-sm text-muted">Sign up to start ordering</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-medium text-muted">Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Phone</label>
          <div className="mt-1 flex">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-surface px-3 text-sm text-muted">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              required
              className="w-full rounded-r-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted">Password</label>
            <input
              type="password"
              placeholder="Min 4 chars"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={4}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Address</label>
          <textarea
            placeholder="Your full address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
            rows={2}
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Live Location</label>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={getLiveLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 text-brand-dark" />
              )}
              {locating ? "Locating..." : "Get Live Location"}
            </button>
            {location && (
              <span className="text-xs text-brand-fresh">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
          </div>
          {locationError && <p className="mt-1 text-xs text-brand-red">{locationError}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Account Type</label>
          <div className="mt-1 grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3 rounded-xl border-2 border-brand-fresh bg-brand-fresh/5 p-4">
              <ShoppingBag className="h-5 w-5 text-brand-fresh" />
              <div className="text-left">
                <p className="text-sm font-bold text-brand-fresh">Customer</p>
                <p className="text-[10px] text-muted">Shop & order groceries</p>
              </div>
            </div>
          </div>

          {/* Hidden admin/delivery options — tap title 5 times to reveal */}
          {showAdminOptions && (
            <div className="mt-1 grid grid-cols-2 gap-2">
              {adminExists() ? (
                <div className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-200 bg-gray-50 p-3 opacity-60">
                  <Shield className="h-5 w-5 text-gray-300" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-400">Admin</p>
                    <p className="text-[9px] text-muted">Already exists</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "admin" })}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                    form.role === "admin"
                      ? "border-brand-dark bg-brand-dark/5"
                      : "border-border hover:border-gray-300"
                  }`}
                >
                  <Shield className={`h-5 w-5 ${form.role === "admin" ? "text-brand-dark" : "text-gray-300"}`} />
                  <div className="text-center">
                    <p className={`text-xs font-bold ${form.role === "admin" ? "text-brand-dark" : "text-gray-500"}`}>Admin</p>
                    <p className="text-[9px] text-muted">Manage store</p>
                  </div>
                </button>
              )}
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "delivery" })}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                  form.role === "delivery"
                    ? "border-brand-fresh bg-brand-fresh/5"
                    : "border-border hover:border-gray-300"
                }`}
              >
                <Truck className={`h-5 w-5 ${form.role === "delivery" ? "text-brand-fresh" : "text-gray-300"}`} />
                <div className="text-center">
                  <p className={`text-xs font-bold ${form.role === "delivery" ? "text-brand-fresh" : "text-gray-500"}`}>Delivery</p>
                  <p className="text-[9px] text-muted">Deliver orders</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <Button type="submit" variant="default" className="w-full" disabled={submitting}>
          {submitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-brand-dark hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-10 px-4"><div className="skeleton h-[600px] rounded-2xl" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
