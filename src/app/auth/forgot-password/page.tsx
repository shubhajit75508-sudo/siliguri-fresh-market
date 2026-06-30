"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!email) { setError("Enter your email"); return; }
    setLoading(true);
    if (isSupabaseConfigured() && supabase) {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      setLoading(false);
      if (supaError) {
        setError(supaError.message);
        return;
      }
      toast.add("Password reset link sent! Check your email.");
    } else {
      setLoading(false);
      toast.add("Dev mode: password reset would be sent (no Supabase)");
    }
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-sm py-16 px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10">
          <KeyRound className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">Forgot Password</h1>
        <p className="mt-1 text-sm text-muted">
          {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>
      )}

      {!sent ? (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <Button variant="default" className="w-full" onClick={handleSend} disabled={loading}>
            Send Reset Link
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-fresh/10">
            <CheckCircle className="h-8 w-8 text-brand-fresh" />
          </div>
          <p className="text-sm text-muted">
            If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <Link href="/auth/login">
            <Button variant="default" className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log In
            </Button>
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/auth/login" className="font-semibold text-white hover:underline">
          <ArrowLeft className="mr-1 inline h-3 w-3" /> Back to Log In
        </Link>
      </p>
    </div>
  );
}
