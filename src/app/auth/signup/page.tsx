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
import { MapPin, Loader2, UserPlus, ShoppingBag } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, login } = useAuthStore();
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

  useEffect(() => {
    if (resolvedAddress && !form.address) {
      setForm((prev) => ({ ...prev, address: resolvedAddress }));
      toast.add("Address filled from live location");
    }
  }, [resolvedAddress]);

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
    let result;
    try {
      result = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        address: form.address,
        role: form.role,
        location,
      });
    } catch {
      setSubmitting(false);
      setError("An unexpected error occurred");
      return;
    }

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
            placeholder="Your name"
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
          <input
            type="tel"
            placeholder="9876543210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
          />
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
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Confirm</label>
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
          <label className="text-xs font-medium text-muted">Delivery Address</label>
          <div className="mt-1 flex gap-2">
            <input
              placeholder="Area, street, landmark"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
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
              {locating ? "Locating..." : "Live"}
            </button>
          </div>
          {location && (
            <span className="text-xs text-brand-fresh">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
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
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
