"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function UpdatePasswordPage() {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase not configured");
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    setError("");
    if (password.length < 4) { setError("Password must be at least 4 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    const { error: updateError } = await supabase!.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    toast.add("Password updated! Please log in.");
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-sm py-16 px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10">
          <Lock className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">{done ? "Password Updated" : "Set New Password"}</h1>
      </div>

      {error && <div className="mb-6 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>}

      {!ready && !done && (
        <p className="text-center text-sm text-muted">Verifying reset link...</p>
      )}

      {ready && !done && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted">New Password</label>
            <div className="mt-1 flex">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 4 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                className="w-full rounded-l-xl border border-r-0 border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="inline-flex items-center rounded-r-xl border border-l-0 border-border bg-[#0d1b2a] px-3 text-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <Button variant="default" className="w-full" onClick={handleUpdate} disabled={loading}>
            <Lock className="mr-2 h-4 w-4" /> Update Password
          </Button>
        </div>
      )}

      {done && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-fresh/10">
            <CheckCircle className="h-8 w-8 text-brand-fresh" />
          </div>
          <Link href="/auth/login">
            <Button variant="default" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log In
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
