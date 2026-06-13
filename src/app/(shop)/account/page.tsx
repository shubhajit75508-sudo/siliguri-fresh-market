"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, updateUser, setUser } = useUserStore();
  const { currentUser, logout: authLogout } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const displayUser = currentUser?.role === "customer" ? currentUser : user;

  useEffect(() => {
    if (currentUser?.role === "customer" && !user) {
      setUser({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        loyaltyPoints: 0,
      });
    }
  }, [currentUser, user, setUser]);

  useEffect(() => {
    if (displayUser) {
      setForm({
        name: displayUser.name || "",
        email: displayUser.email || "",
        phone: displayUser.phone || "",
      });
    }
  }, [displayUser]);

  const handleSave = () => {
    updateUser(form);
    setEditing(false);
  };

  const handleLogout = async () => {
    setUser(null);
    await authLogout();
    document.cookie = "sfm-auth-session=; path=/; max-age=0";
    router.push("/auth/login");
  };

  if (!displayUser) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <h2 className="text-lg font-bold">Not signed in</h2>
        <p className="mt-2 text-sm text-muted">Log in to manage your account.</p>
        <Button variant="default" className="mt-4" onClick={() => router.push("/auth/login")}>
          Log In
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-bold">Profile Details</h2>

      {editing ? (
        <div className="mt-4 space-y-4">
          {(["name", "email", "phone"] as const).map((field) => (
            <div key={field}>
              <label className="text-xs font-medium text-muted capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
              />
            </div>
          ))}
          <div className="flex gap-3">
            <Button variant="default" onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {[
            { label: "Name", value: displayUser.name },
            { label: "Email", value: displayUser.email },
            { label: "Phone", value: displayUser.phone },
            { label: "Coins", value: (user?.loyaltyPoints ?? 0).toString() },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs font-medium text-muted">{field.label}</label>
              <p className="mt-1 text-sm font-semibold">{field.value}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
            {currentUser && currentUser.role !== "customer" && (
              <Button variant="default" onClick={() => router.push(currentUser.role === "admin" ? "/admin" : "/delivery")}>
                Go to {currentUser.role === "admin" ? "Admin" : "Delivery"} Panel
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="text-brand-red border-brand-red/30 hover:bg-brand-red/5">Sign Out</Button>
          </div>
        </div>
      )}
    </div>
  );
}
