"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/user-store";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useToast } from "@/components/ui/toaster";
import type { Address } from "@/types";

export default function AddressesPage() {
  const { addresses, addAddress } = useUserStore();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "Siliguri",
    pincode: "",
    lat: "",
    lng: "",
  });
  const { location, locating, getLocation: detectLocation } = useGeolocation();

  useEffect(() => {
    if (location) {
      setForm((f) => ({
        ...f,
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
      }));
      toast.add("Location detected");
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.line1.trim() || !form.pincode.trim()) {
      toast.add("Please fill in address and pincode", "error");
      return;
    }

    const newAddress: Address = {
      id: Date.now().toString(),
      label: form.label.trim() || "Home",
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim() || "Siliguri",
      pincode: form.pincode.trim(),
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lng: form.lng ? parseFloat(form.lng) : undefined,
      isDefault: addresses.length === 0,
    };

    addAddress(newAddress);
    setForm({ label: "Home", line1: "", line2: "", city: "Siliguri", pincode: "", lat: "", lng: "" });
    setShowForm(false);
    toast.add("Address saved");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Saved Addresses</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card mb-4 space-y-3 rounded-2xl p-4">
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (Home, Work…)"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <input
            value={form.line1}
            onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
            placeholder="Address line 1"
            required
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <input
            value={form.line2}
            onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
            placeholder="Address line 2 (optional)"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City"
              className="rounded-xl border border-border px-3 py-2 text-sm"
            />
            <input
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              placeholder="Pincode"
              required
              className="rounded-xl border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              placeholder="Latitude"
              className="rounded-xl border border-border px-3 py-2 text-sm"
            />
            <input
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              placeholder="Longitude"
              className="rounded-xl border border-border px-3 py-2 text-sm"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
            <Navigation className="h-4 w-4" /> Detect Current Location
          </Button>
          <div className="flex gap-2">
            <Button type="submit" variant="fresh" size="sm">Save Address</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-brand-fresh" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{addr.label}</p>
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
                  <p className="mt-1 text-xs text-muted">
                    Location: {addr.lat}, {addr.lng}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
