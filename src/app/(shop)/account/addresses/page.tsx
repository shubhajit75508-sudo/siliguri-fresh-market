"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Loader2, Building2, Trash2, Star, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/user-store";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useToast } from "@/components/ui/toaster";
import type { Address } from "@/types";

export default function AddressesPage() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useUserStore();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCoords, setShowCoords] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    area: "",
    landmark: "",
    building: "",
    flat: "",
    floor: "",
    city: "Siliguri",
    pincode: "",
    lat: "",
    lng: "",
  });
  const { location, locating, error: locationError, resolvedAddress, getLocation: detectLocation } = useGeolocation();

  useEffect(() => {
    if (showForm && !location && !locating) {
      detectLocation();
    }
  }, [showForm]);

  useEffect(() => {
    if (location) {
      setForm((f) => ({
        ...f,
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
      }));
    }
  }, [location]);

  useEffect(() => {
    if (resolvedAddress && !form.line1) {
      const match = resolvedAddress.match(/\b\d{6}\b/);
      setForm((f) => ({
        ...f,
        line1: resolvedAddress,
        pincode: match ? match[0] : f.pincode,
      }));
      toast.add("Address filled from live location");
    }
  }, [resolvedAddress]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ label: "Home", line1: "", line2: "", area: "", landmark: "", building: "", flat: "", floor: "", city: "Siliguri", pincode: "", lat: "", lng: "" });
    setShowCoords(false);
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      area: addr.area ?? "",
      landmark: addr.landmark ?? "",
      building: addr.building ?? "",
      flat: addr.flat ?? "",
      floor: addr.floor ?? "",
      city: addr.city,
      pincode: addr.pincode,
      lat: addr.lat?.toString() ?? "",
      lng: addr.lng?.toString() ?? "",
    });
    setShowCoords(!!addr.lat);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.line1.trim() || !form.pincode.trim() || !form.area.trim() || !form.landmark.trim() || !form.building.trim()) {
      toast.add("Please fill in Street, Area, Landmark, Building, and Pincode", "error");
      return;
    }

    const addrData: Address = {
      id: editingId ?? crypto.randomUUID(),
      label: form.label.trim() || "Home",
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      area: form.area.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      building: form.building.trim() || undefined,
      flat: form.flat.trim() || undefined,
      floor: form.floor.trim() || undefined,
      city: form.city.trim() || "Siliguri",
      pincode: form.pincode.trim(),
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lng: form.lng ? parseFloat(form.lng) : undefined,
      isDefault: editingId ? (addresses.find((a) => a.id === editingId)?.isDefault ?? addresses.length === 0) : addresses.length === 0,
    };

    if (editingId) {
      updateAddress(addrData);
      toast.add("Address updated");
    } else {
      addAddress(addrData);
      toast.add("Address saved");
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteAddress(id);
    setConfirmDelete(null);
    toast.add("Address deleted");
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">Saved Addresses</h2>
        <Button variant="outline" size="sm" onClick={openAddForm} className="rounded-full">
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card mb-5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <MapPin className="h-4 w-4 text-brand-fresh-dim" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              {editingId ? "Edit Address" : "New Address"}
            </span>
          </div>

          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (Home, Work…)"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />

          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Location Details
            </p>
            <div className="space-y-3">
              <input
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                placeholder="Street / Road / Colony *"
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  placeholder="Area / Locality *"
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                />
                <input
                  value={form.landmark}
                  onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                  placeholder="Landmark *"
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Building Details
            </p>
            <div className="grid grid-cols-3 gap-3">
              <input
                value={form.building}
                onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
                placeholder="Building / House *"
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <input
                value={form.flat}
                onChange={(e) => setForm((f) => ({ ...f, flat: e.target.value }))}
                placeholder="Flat / Door No."
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <input
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="Floor (optional)"
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <input
            value={form.line2}
            onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
            placeholder="Additional info (optional)"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
          />

          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">City & Pincode</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <input
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                placeholder="Pincode *"
                required
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm tracking-widest font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={detectLocation}
              disabled={locating}
              className="flex items-center gap-2 rounded-full border border-brand-fresh/30 bg-brand-fresh/5 px-4 py-2 text-xs font-semibold text-brand-fresh-dim hover:bg-brand-fresh/10 transition-all disabled:opacity-60"
            >
              {locating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting...</>
              ) : (
                <><Crosshair className="h-3.5 w-3.5" /> Detect Current Location</>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCoords(!showCoords)}
              className="text-[10px] text-muted underline underline-offset-2 hover:text-foreground"
            >
              {showCoords ? "Hide coordinates" : "Show coordinates"}
            </button>
          </div>
          {locationError && <p className="text-xs text-brand-red flex items-center gap-1"><Loader2 className="h-3 w-3" /> {locationError}</p>}

          {showCoords && (
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="Latitude"
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <input
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="Longitude"
                className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Button type="submit" variant="fresh" size="sm" className="rounded-full">
              {editingId ? "Update Address" : "Save Address"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {addresses.length === 0 && !showForm && (
          <div className="rounded-2xl bg-surface py-14 text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm text-muted">No saved addresses yet</p>
            <Button variant="fresh" size="sm" className="mt-3 rounded-full" onClick={openAddForm}>
              <Plus className="h-4 w-4" /> Add Your First Address
            </Button>
          </div>
        )}
        {addresses.map((addr) => (
          <div key={addr.id} className="glass-card rounded-2xl p-4 transition-all hover:shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-fresh/10">
                <MapPin className="h-4 w-4 text-brand-fresh-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{addr.label}</p>
                  {addr.isDefault && <Badge variant="fresh" className="text-[10px] px-2 py-0">Default</Badge>}
                </div>
                <div className="mt-1.5 space-y-0.5 text-xs text-muted">
                  <p className="flex items-center gap-1.5">
                    <span className="inline-block h-1 w-1 rounded-full bg-muted shrink-0" />
                    {addr.line1}{addr.area ? `, ${addr.area}` : ""}
                  </p>
                  {addr.landmark && (
                    <p className="flex items-center gap-1.5">
                      <span className="inline-block h-1 w-1 rounded-full bg-muted shrink-0" />
                      Near {addr.landmark}
                    </p>
                  )}
                  {(addr.building || addr.flat || addr.floor) && (
                    <p className="flex items-center gap-1.5">
                      <span className="inline-block h-1 w-1 rounded-full bg-muted shrink-0" />
                      {addr.building}{addr.flat ? `, Flat ${addr.flat}` : ""}{addr.floor ? `, Floor ${addr.floor}` : ""}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 font-medium text-foreground/70">
                    <span className="inline-block h-1 w-1 rounded-full bg-muted shrink-0" />
                    {addr.city} — {addr.pincode}
                  </p>
                  {addr.lat && addr.lng && (
                    <p className="flex items-center gap-1 text-[10px] text-brand-fresh-dim mt-0.5">
                      <Crosshair className="h-3 w-3" /> GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!addr.isDefault && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setDefaultAddress(addr.id); toast.add("Default address updated"); }} title="Set as default">
                    <Star className="h-3.5 w-3.5 text-muted hover:text-brand-gold" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditForm(addr)} title="Edit">
                  <Building2 className="h-3.5 w-3.5 text-muted hover:text-foreground" />
                </Button>
                {confirmDelete === addr.id ? (
                  <div className="flex gap-1">
                    <Button variant="destructive" size="sm" className="h-7 rounded-full text-[10px] px-2" onClick={() => handleDelete(addr.id)}>Delete</Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setConfirmDelete(null)}>
                      <span className="text-[10px] text-muted">No</span>
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setConfirmDelete(addr.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5 text-muted hover:text-brand-red" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}