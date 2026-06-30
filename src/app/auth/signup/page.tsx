"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/ui/toaster";
import { useUserStore } from "@/store/user-store";
import { Loader2, UserPlus, ShoppingBag, Eye, EyeOff, Check, X } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, login } = useAuthStore();
  const { setUser } = useUserStore();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer" as "admin" | "delivery" | "customer",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!form.phone.trim()) { setError("Phone is required"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    let result;
    try {
      result = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        address: "",
        location: null,
        role: form.role,
      });
    } catch {
      setSubmitting(false);
      setError("An unexpected error occurred");
      return;
    }

    if (result.success) {
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
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-gradient-to-b from-white to-surface/60 p-8 shadow-lg shadow-black/5 ring-1 ring-black/5">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-dark to-brand-dark/80 shadow-md shadow-brand-dark/20">
              <UserPlus className="h-7 w-7 text-white" />
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
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
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
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
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
                className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted">Password</label>
                <div className="mt-1 flex">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full rounded-l-xl border border-r-0 border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-dark"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="inline-flex items-center rounded-r-xl border border-l-0 border-border bg-surface px-3 text-muted transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {form.password.length >= 8 ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-400" />
                    )}
                    <span className="text-[10px] text-muted">Minimum 8 characters</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Confirm</label>
                <div className="mt-1 flex">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className="w-full rounded-l-xl border border-r-0 border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-dark"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="inline-flex items-center rounded-r-xl border border-l-0 border-border bg-surface px-3 text-muted transition-colors hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
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

            <Button type="submit" variant="default" className="w-full shadow-md shadow-brand-dark/20" disabled={submitting}>
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-dark transition-colors hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
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
