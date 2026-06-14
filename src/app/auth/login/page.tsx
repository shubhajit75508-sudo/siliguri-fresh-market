"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useAdminStore } from "@/store/admin-store";
import { useDeliveryStore } from "@/store/delivery-store";
import { useToast } from "@/components/ui/toaster";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const adminStore = useAdminStore();
  const deliveryStore = useDeliveryStore();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setSubmitting(true);
    let result;
    try {
      result = await login(email, password);
    } catch {
      setSubmitting(false);
      setError("An unexpected error occurred");
      return;
    }

    if (result.success && result.user) {
      toast.add(`Welcome, ${result.user.name}!`);

      if (result.user.role === "admin") {
        adminStore.loginDirect(result.user);
        setTimeout(() => router.push("/admin"), 100);
      } else if (result.user.role === "delivery") {
        const ok = deliveryStore.loginAsBoy(result.user, result.user.name, result.user.phone);
        if (!ok) { setError("Failed to set up delivery session. Try logging out first."); setSubmitting(false); return; }
        setTimeout(() => router.push("/delivery"), 100);
      } else {
        setTimeout(() => router.push("/"), 100);
      }
    } else {
      setError(result.error ?? "Login failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-sm py-16 px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10">
          <LogIn className="h-7 w-7 text-brand-dark" />
        </div>
        <h1 className="text-2xl font-extrabold">Log In</h1>
        <p className="mt-1 text-sm text-muted">Log in to your account</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Password</label>
          <div className="mt-1 flex">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-l-xl border border-r-0 border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="inline-flex items-center rounded-r-xl border border-l-0 border-border bg-white px-3 text-muted hover:text-brand-dark"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs font-medium text-muted hover:text-brand-dark">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" variant="default" className="w-full" disabled={submitting}>
          {submitting ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-brand-dark hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
