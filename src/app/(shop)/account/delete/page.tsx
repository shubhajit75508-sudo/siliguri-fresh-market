"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Trash2,
  MessageCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default function DeleteAccountPage() {
  const { user, setUser } = useUserStore();
  const { currentUser, logout: authLogout } = useAuthStore();
  const [confirmed, setConfirmed] = useState(false);

  const displayUser = currentUser?.role === "customer" ? currentUser : user;

  if (!displayUser) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <h2 className="text-lg font-bold">Not signed in</h2>
        <p className="mt-2 text-sm text-muted">Log in to manage your account.</p>
        <Button variant="default" className="mt-4" asChild>
          <a href="/auth/login">Log In</a>
        </Button>
      </div>
    );
  }

  const handleWhatsAppRedirect = () => {
    const msg = encodeURIComponent(
      `Hi, I want to request deletion of my account.\n\nName: ${displayUser.name}\nEmail: ${displayUser.email}\nPhone: ${displayUser.phone}\n\nPlease delete my account and all associated data within 1 week. Thank you.`
    );
    window.open(`https://wa.me/917029908278?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Delete Account</h2>
        <p className="mt-1 text-sm text-muted">
          We&apos;re sorry to see you go. Here&apos;s how to request account deletion.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
          <div>
            <h3 className="font-bold">What gets deleted</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
              <li>Your profile and personal information</li>
              <li>Saved addresses and preferences</li>
              <li>Wishlist and notification settings</li>
              <li>All account-related data</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-amber" />
          <div>
            <h3 className="font-bold">Processing time</h3>
            <p className="mt-1 text-sm text-muted">
              Account deletion requests are processed within <strong>1 week</strong>. You will be notified via email or WhatsApp once your account has been deleted.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
          <div>
            <h3 className="font-bold">Important notes</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
              <li>Order history may be retained as required by law for tax/record purposes</li>
              <li>Any pending orders must be completed or cancelled before deletion</li>
              <li>This action cannot be undone once processed</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand-red/20 bg-brand-red/5 p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red/10">
            <Trash2 className="h-7 w-7 text-brand-red" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Request deletion via WhatsApp</h3>
            <p className="mt-1 text-sm text-muted">
              Send us a WhatsApp message with your details to initiate the deletion process.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-brand-red"
                />
                <span className="text-xs text-muted">
                  I understand that this action is irreversible
                </span>
              </label>
            </div>
            <Button
              variant="outline"
              disabled={!confirmed}
              className={`mt-3 ${
                confirmed
                  ? "border-brand-red/30 text-brand-red hover:bg-brand-red/10"
                  : "cursor-not-allowed opacity-50"
              }`}
              onClick={handleWhatsAppRedirect}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Send Request via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
