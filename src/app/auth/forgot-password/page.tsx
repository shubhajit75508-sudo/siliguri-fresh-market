"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useAuthStore } from "@/store/auth-store";
import { KeyRound, ArrowLeft, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const { users, resetPassword } = useAuthStore();
  const [step, setStep] = useState<"email" | "code" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = () => {
    setError("");
    const user = users.find((u) => u.email === email);
    if (!user) {
      setError("No account found with this email");
      return;
    }
    toast.add("Reset code sent to your email (mock: 1234)");
    setStep("code");
  };

  const handleVerifyCode = () => {
    setError("");
    if (code !== "1234") {
      setError("Invalid code. Try 1234");
      return;
    }
    setStep("reset");
  };

  const handleReset = async () => {
    setError("");
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const result = await resetPassword(email, password);
    if (!result.success) {
      setError(result.error ?? "Failed to reset password");
      return;
    }
    toast.add("Password reset successfully! Please log in.");
    setStep("done");
  };

  return (
    <div className="mx-auto max-w-sm py-16 px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10">
          <KeyRound className="h-7 w-7 text-brand-dark" />
        </div>
        <h1 className="text-2xl font-extrabold">
          {step === "email" && "Forgot Password"}
          {step === "code" && "Check Your Email"}
          {step === "reset" && "Reset Password"}
          {step === "done" && "Password Reset"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {step === "email" && "Enter your email to receive a reset code"}
          {step === "code" && `We sent a code to ${email}`}
          {step === "reset" && "Choose a new password"}
          {step === "done" && "Your password has been updated"}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">{error}</div>
      )}

      {step === "email" && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <Button variant="default" className="w-full" onClick={handleSendCode}>
            Send Reset Code
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted">Reset Code</label>
            <input
              type="text"
              placeholder="Enter 4-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-center font-bold tracking-widest outline-none focus:border-brand-dark"
            />
            <p className="mt-1 text-xs text-muted">Mock code: 1234</p>
          </div>
          <Button variant="default" className="w-full" onClick={handleVerifyCode}>
            Verify Code
          </Button>
          <button
            onClick={() => setStep("email")}
            className="w-full text-center text-sm text-muted hover:text-brand-dark"
          >
            Use a different email
          </button>
        </div>
      )}

      {step === "reset" && (
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
          <div>
            <label className="text-xs font-medium text-muted">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <Button variant="default" className="w-full" onClick={handleReset}>
            <Lock className="mr-2 h-4 w-4" /> Reset Password
          </Button>
        </div>
      )}

      {step === "done" && (
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

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/auth/login" className="font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="mr-1 inline h-3 w-3" /> Back to Log In
        </Link>
      </p>
    </div>
  );
}