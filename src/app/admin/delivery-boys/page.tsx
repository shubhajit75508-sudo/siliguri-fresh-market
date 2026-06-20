"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useDeliveryStore } from "@/store/delivery-store";
import { useToast } from "@/components/ui/toaster";
import type { DeliveryBoy } from "@/types";

export default function AdminDeliveryBoysPage() {
  const { deliveryBoys, addBoy, removeBoy } = useDeliveryStore();
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", area: "" });
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/delivery-boys");
        if (res.ok) {
          const json = await res.json();
          const apiBoys: DeliveryBoy[] = (json.boys ?? []).map((b: Record<string, unknown>) => ({
            id: b.id as string,
            name: b.name as string,
            phone: b.phone as string,
            email: (b as any).email ?? "",
            code: b.code as string,
            isActive: b.is_active as boolean,
            area: b.area as string,
          }));
          setBoys(apiBoys);
          apiBoys.forEach((b) => addBoy(b));
        }
      } catch { /* use local fallback */ }
      if (boys.length === 0) setBoys(deliveryBoys);
      setLoading(false);
    })();
  }, []);

  const addBoyFn = async () => {
    if (!form.name || !form.phone) {
      toast.add("Name and phone are required", "error");
      return;
    }
    const email = form.email || `${form.name.toLowerCase().replace(/\s+/g, ".")}@delivery.sfm`;
    const password = form.password || crypto.randomUUID().slice(0, 12);

    setSaving(true);
    try {
      const res = await fetch("/api/admin/delivery-boys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, email, password, area: form.area || "Siliguri" }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.add(err.error || "Failed to create delivery boy", "error");
        setSaving(false);
        return;
      }
      const data = await res.json();

      const newBoy: DeliveryBoy = {
        id: data.id,
        name: form.name,
        phone: form.phone,
        email,
        code: form.name.slice(0, 3).toUpperCase() + form.phone.slice(-3),
        isActive: true,
        area: form.area || "Siliguri",
      };

      addBoy(newBoy);
      setBoys((prev) => [newBoy, ...prev]);
      setForm({ name: "", phone: "", email: "", password: "", area: "" });
      setAdding(false);
      toast.add(`Delivery boy ${form.name} added`);
    } catch {
      toast.add("Network error. Try again.", "error");
    }
    setSaving(false);
  };

  const removeBoyFn = async (id: string) => {
    try {
      await fetch(`/api/admin/delivery-boys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch { /* best-effort */ }
    removeBoy(id);
    setBoys((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#5a7278]" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Delivery Boys</h2>
          <p className="text-sm text-muted">{boys.length} registered</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-fresh px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-fresh/25 hover:bg-brand-fresh-dim">
          <Plus className="h-4 w-4" /> Add Delivery Boy
        </button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-bold">New Delivery Boy</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Email (auto-filled if blank)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Password (auto-generated if blank)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl border border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Service Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="rounded-xl border border-border bg-[#0d1b2a] px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addBoyFn} disabled={saving} className="rounded-xl bg-brand-fresh px-5 py-2 text-sm font-bold text-white hover:bg-brand-fresh-dim disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:bg-surface">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-[#0d1b2a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-surface text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boys.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#5a7278]">No delivery boys registered.</td></tr>
            ) : (
              [...boys].reverse().map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted">{b.phone}</td>
                  <td className="px-4 py-3 text-muted">{b.email || "—"}</td>
                  <td className="px-4 py-3 text-muted">{b.code || "—"}</td>
                  <td className="px-4 py-3 text-muted">{b.area || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">Active</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeBoyFn(b.id)} className="rounded-lg p-2 text-brand-red hover:bg-brand-red/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}