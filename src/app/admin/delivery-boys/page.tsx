"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import type { DeliveryBoy } from "@/types";

const STORAGE_KEY = "sfm-delivery-boys";

function loadBoys(): DeliveryBoy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveBoys(boys: DeliveryBoy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boys));
}

export default function AdminDeliveryBoysPage() {
  const [boys, setBoys] = useState<DeliveryBoy[]>(loadBoys);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", code: "", area: "" });

  useEffect(() => { saveBoys(boys); }, [boys]);

  const addBoy = () => {
    if (!form.name || !form.phone || !form.code) return;
    const newBoy: DeliveryBoy = {
      id: "db-" + Date.now(),
      name: form.name,
      phone: form.phone,
      code: form.code.toUpperCase(),
      isActive: true,
      area: form.area,
    };
    setBoys((prev) => [...prev, newBoy]);
    setForm({ name: "", phone: "", code: "", area: "" });
    setAdding(false);
  };

  const toggleActive = (id: string) => {
    setBoys((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const remove = (id: string) => {
    if (confirm("Remove this delivery boy?")) {
      setBoys((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Delivery Boys</h2>
          <p className="text-sm text-muted">{boys.length} registered</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-fresh px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-fresh/25 hover:bg-brand-fresh-dim"
        >
          <Plus className="h-4 w-4" /> Add Delivery Boy
        </button>
      </div>

      {adding && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-border bg-surface p-5"
        >
          <h3 className="mb-4 font-bold">New Delivery Boy</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Delivery Code (e.g. DEL444)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40 uppercase" />
            <input placeholder="Service Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addBoy} className="rounded-xl bg-brand-fresh px-5 py-2 text-sm font-bold text-white hover:bg-brand-fresh-dim">Save</button>
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
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No delivery boys registered.
                </td>
              </tr>
            ) : (
              boys.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted">{b.phone}</td>
                  <td className="px-4 py-3 font-mono font-bold text-brand-fresh-dim">{b.code}</td>
                  <td className="px-4 py-3 text-muted">{b.area}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(b.id)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(b.id)} className="rounded-lg p-2 text-brand-red hover:bg-brand-red/10">
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