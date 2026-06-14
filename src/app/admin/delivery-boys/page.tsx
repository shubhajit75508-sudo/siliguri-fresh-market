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
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", code: "", area: "", email: "", password: "" });
  const toast = useToast();

  useEffect(() => {
    const localBoys = deliveryBoys;
    fetch("/api/admin/delivery-boys")
      .then((r) => r.json())
      .then((json) => {
        const remote = (json.boys ?? []).map((b: { id: string; name: string; phone: string; email: string }) => ({
          id: b.id,
          name: b.name,
          phone: b.phone ?? "",
          email: b.email ?? "",
          code: b.name.slice(0, 3).toUpperCase() + (b.phone?.slice(-3) ?? "000"),
          isActive: true,
          area: "",
        }));
        const merged = [...localBoys];
        for (const r of remote) {
          if (!merged.find((m) => m.id === r.id)) merged.push(r);
        }
        setBoys(merged);
      })
      .catch(() => setBoys(localBoys))
      .finally(() => setLoading(false));
  }, [deliveryBoys]);

  const addBoyFn = async () => {
    if (!form.name || !form.phone) {
      toast.add("Name and phone are required", "error");
      return;
    }
    const id = "db-" + crypto.randomUUID().slice(0, 8);
    const newBoy: DeliveryBoy = {
      id,
      name: form.name,
      phone: form.phone,
      email: form.email || `${form.name.toLowerCase().replace(/\s+/g, ".")}@delivery.sfm`,
      code: form.name.slice(0, 3).toUpperCase() + form.phone.slice(-3),
      isActive: true,
      area: form.area || "Siliguri",
    };

    // Try Supabase, always save locally
    try {
      await fetch("/api/admin/delivery-boys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: newBoy.email, password: form.password || "delivery123" }),
      });
    } catch {}

    addBoy(newBoy);
    setBoys((prev) => [...prev.filter((b) => b.id !== id), newBoy]);
    setForm({ name: "", phone: "", code: "", area: "", email: "", password: "" });
    setAdding(false);
    toast.add(`Delivery boy ${form.name} added`);
  };

  const removeBoyFn = async (id: string) => {
    removeBoy(id);
    setBoys((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
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
            <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Email (auto-filled if blank)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Password (default: delivery123)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Service Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addBoyFn} className="rounded-xl bg-brand-fresh px-5 py-2 text-sm font-bold text-white hover:bg-brand-fresh-dim">Save</button>
            <button onClick={() => setAdding(false)} className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:bg-surface">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-surface text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boys.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No delivery boys registered.</td></tr>
            ) : (
              boys.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted">{b.phone}</td>
                  <td className="px-4 py-3 text-muted">{b.email || "—"}</td>
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
