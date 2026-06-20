"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCouponStore } from "@/store/coupon-store";
import { useToast } from "@/components/ui/toaster";

export default function CouponsPage() {
  const { coupons, addCoupon, deleteCoupon } = useCouponStore();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discount: 0, type: "flat" as "flat" | "percentage", minOrder: 0 });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.add("Enter a coupon code", "error"); return; }
    if (coupons.find((c) => c.code === form.code.toUpperCase())) {
      toast.add("Coupon code already exists", "error");
      return;
    }
    addCoupon({ code: form.code.toUpperCase(), discount: form.discount, type: form.type, minOrder: form.minOrder });
    setForm({ code: "", discount: 0, type: "flat", minOrder: 0 });
    setShowForm(false);
    toast.add("Coupon created");
  };

  const handleDelete = (code: string) => {
    if (confirm(`Delete coupon ${code}?`)) {
      deleteCoupon(code);
      toast.add("Coupon deleted");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Button variant="default" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 max-w-md rounded-xl border bg-[#0d1b2a] p-5 shadow-sm space-y-3">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="COUPON CODE" className="w-full rounded-lg border px-3 py-2 text-sm uppercase outline-none focus:border-brand-dark" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.discount || ""} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} placeholder="Discount" className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "flat" | "percentage" })} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark">
              <option value="flat">Flat (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
          <input type="number" value={form.minOrder || ""} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} placeholder="Min order amount" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          <div className="flex gap-2">
            <Button type="submit" variant="default" size="sm">Save</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[...coupons].reverse().map((c) => (
          <div key={c.code} className="rounded-xl border bg-[#0d1b2a] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <code className="text-lg font-bold text-white">{c.code}</code>
              <div className="flex items-center gap-2">
                <Badge variant="fresh">Active</Badge>
                <button onClick={() => handleDelete(c.code)} className="rounded-lg p-1 hover:bg-red-50"><Trash2 className="h-4 w-4 text-brand-red" /></button>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium">
              {c.type === "flat" ? `₹${c.discount} off` : `${c.discount}% off`}
            </p>
            <p className="text-xs text-[#80949b]">Min order: ₹{c.minOrder}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
