"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, Save, X, PackageOpen } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllProducts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";
import type { Product } from "@/types";

const API_BASE = "/api/admin/products";

export default function AdminProductsPage() {
  const { products: storeProducts, addProduct, updateProduct, deleteProduct } = useAdminStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const supabaseAvailable = isSupabaseConfigured();

  const { data: liveProducts } = useQuery({
    queryKey: ["products", "all"],
    queryFn: getAllProducts,
    enabled: supabaseAvailable,
  });

  const products = supabaseAvailable && liveProducts ? liveProducts : storeProducts;

  const existingSlugs = useRef(new Set<string>());

  useEffect(() => {
    existingSlugs.current = new Set(products.map((p) => p.slug));
  }, [products]);

  const createUniqueSlug = (name: string) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let slug = base;
    let i = 1;
    while (existingSlugs.current.has(slug)) {
      slug = `${base}-${i}`;
      i++;
    }
    existingSlugs.current.add(slug);
    return slug;
  };

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ ...p });
  };

  const saveEdit = async () => {
    if (!editingId || !form.name) return;
    setSaving(true);
    try {
      if (supabaseAvailable) {
        const slug = form.name ? form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : undefined;
        const res = await fetch(API_BASE, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form, slug }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
      }
      updateProduct(editingId, form);
      invalidateProducts();
      setEditingId(null);
      setForm({});
    } catch (e) {
      console.error("Product update failed:", e);
      toast.add(e instanceof Error ? e.message : "Failed to update product", "error");
    }
    setSaving(false);
  };

  const openAdd = () => {
    setAdding(true);
    setForm({
      name: "",
      price: 0,
      image: "",
      category: "fish",
      description: "",
      weight: [],
    });
  };

  const saveAdd = async () => {
    if (!form.name || form.price === undefined || form.price === null || form.price < 0 || !form.image) return;
    setSaving(true);
    const id = crypto.randomUUID();
    const slug = createUniqueSlug(form.name);
    const product = { ...form, id, slug } as Product;
    try {
      if (supabaseAvailable) {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Insert failed");
        }
      }
      addProduct(product);
      invalidateProducts();
      setAdding(false);
      setForm({});
    } catch (e) {
      console.error("Product insert failed:", e);
      toast.add(e instanceof Error ? e.message : "Failed to save product", "error");
      existingSlugs.current.delete(slug);
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      if (supabaseAvailable) {
        const res = await fetch(`${API_BASE}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Delete failed");
        }
      }
      deleteProduct(id);
      invalidateProducts();
    } catch (e) {
      console.error("Product delete failed:", e);
      toast.add(e instanceof Error ? e.message : "Failed to delete product", "error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Products</h2>
          <p className="text-sm text-muted">{products.length} total</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-fresh px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-fresh/25 transition-all hover:bg-brand-fresh-dim"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {adding && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-border bg-surface p-5"
        >
          <h3 className="mb-4 font-bold text-white">New Product</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-white/10 bg-[#0d1b2a] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-fresh/40" />
            <input placeholder="Image URL" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="rounded-xl border border-white/10 bg-[#0d1b2a] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-fresh/40" />
            <select value={form.category || "fish"} onChange={(e) => setForm({ ...form, category: e.target.value as import("@/types").Category })} className="rounded-xl border border-white/10 bg-[#0d1b2a] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-fresh/40">
              <option value="fish">Fish</option>
              <option value="chicken">Chicken</option>
              <option value="mutton">Mutton</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="dairy">Dairy & Eggs</option>
            </select>
            <input placeholder="Discount % (0)" type="number" value={form.discount || 0} onChange={(e) => setForm({ ...form, discount: +e.target.value })} className="rounded-xl border border-white/10 bg-[#0d1b2a] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-fresh/40 sm:col-span-1" />
            <textarea placeholder="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border border-white/10 bg-[#0d1b2a] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-fresh/40 sm:col-span-2" rows={2} />
          </div>

          {/* Weight-Price List */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white">Weight & Pricing</h4>
              <button
                type="button"
                onClick={() => {
                  const wps = form.weightPrices || [];
                  setForm({ ...form, weightPrices: [...wps, { weight: "", price: 0 }], price: wps[0]?.price || form.price || 0, weight: [...(form.weight || []), ""] });
                }}
                className="text-xs font-bold text-[#2ecc71] hover:underline"
              >
                + Add Weight
              </button>
            </div>
            <div className="space-y-2">
              {(form.weightPrices || []).map((wp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="Weight (e.g. 50g, 1kg)"
                    value={wp.weight}
                    onChange={(e) => {
                      const wps = [...(form.weightPrices || [])];
                      wps[i] = { ...wps[i], weight: e.target.value };
                      setForm({ ...form, weightPrices: wps, weight: wps.map(w => w.weight).filter(Boolean) });
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-[#0d1b2a] px-3 py-2 text-sm text-white outline-none focus:border-brand-fresh/40"
                  />
                  <span className="text-[#80949b] text-sm">₹</span>
                  <input
                    placeholder="Price"
                    type="number"
                    value={wp.price || ""}
                    onChange={(e) => {
                      const wps = [...(form.weightPrices || [])];
                      wps[i] = { ...wps[i], price: +e.target.value };
                      setForm({ ...form, weightPrices: wps, price: wps[0]?.price || form.price || 0 });
                    }}
                    className="w-24 rounded-xl border border-white/10 bg-[#0d1b2a] px-3 py-2 text-sm text-white outline-none focus:border-brand-fresh/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const wps = (form.weightPrices || []).filter((_, j) => j !== i);
                      setForm({ ...form, weightPrices: wps, price: wps[0]?.price || 0, weight: wps.map(w => w.weight).filter(Boolean) });
                    }}
                    className="text-[#e74c3c] hover:bg-[#e74c3c]/10 rounded-lg p-1.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {(form.weightPrices || []).length === 0 && (
              <p className="text-xs text-[#80949b] mt-1">Add weight options above. First weight's price becomes the default.</p>
            )}
            {(form.weightPrices || []).length >= 1 && (form.weightPrices || [])[0].weight && (form.weightPrices || [])[0].price > 0 && (
              <button
                type="button"
                onClick={() => {
                  const base = (form.weightPrices || [])[0];
                  const wps = [...(form.weightPrices || [])];
                  const parseG = (w: string) => { const m = w.match(/^([\d.]+)\s*(g|kg)$/i); return m ? (m[2].toLowerCase()==="kg" ? parseFloat(m[1])*1000 : parseFloat(m[1])) : null; };
                  const baseG = parseG(base.weight);
                  if (baseG) {
                    const multiplier = base.price / baseG;
                    const suggestions = [{ weight: `${(baseG * 2 >= 1000 ? (baseG * 2 / 1000) + 'kg' : baseG * 2 + 'g')}`, price: Math.round(baseG * 2 * multiplier) }, { weight: `${(baseG * 4 >= 1000 ? (baseG * 4 / 1000) + 'kg' : baseG * 4 + 'g')}`, price: Math.round(baseG * 4 * multiplier) }];
                    const existing = new Set(wps.map(w => w.weight.toLowerCase()));
                    for (const s of suggestions) { if (!existing.has(s.weight.toLowerCase())) wps.push(s); }
                    setForm({ ...form, weightPrices: wps, weight: wps.map(w => w.weight).filter(Boolean), price: wps[0]?.price || form.price || 0 });
                  }
                }}
                className="mt-2 text-[11px] font-bold text-[#4A8FE7] hover:underline"
              >
                ⚡ Auto-generate 2× and 4× options
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={saveAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand-fresh px-5 py-2 text-sm font-bold text-white hover:bg-brand-fresh-dim">
              <Save className="h-4 w-4" /> Save
            </button>
            <button onClick={() => { setAdding(false); setForm({}); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2 text-sm font-medium text-[#80949b] hover:bg-white/5">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </motion.div>
      )}

      {products.length === 0 ? (
        <div className="glass-card flex flex-col items-center rounded-2xl p-12">
          <PackageOpen className="mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No products yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...products].reverse().map((p) =>
                editingId === p.id ? (
                  <tr key={p.id} className="border-b border-border">
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm outline-none" placeholder="Name" />
                        <input value={form.price || 0} type="number" onChange={(e) => setForm({ ...form, price: +e.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm outline-none" placeholder="Price" />
                        <input value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm outline-none" placeholder="Image URL" />
                        <div className="sm:col-span-4 grid gap-2 sm:grid-cols-4">
                          {(form.weightPrices || []).map((wp, i) => (
                            <div key={i} className="flex gap-1 items-center">
                              <input value={wp.weight} onChange={(e) => { const wps = [...(form.weightPrices || [])]; wps[i] = { ...wps[i], weight: e.target.value }; setForm({ ...form, weightPrices: wps }); }} className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs outline-none" placeholder="Wt" />
                              <span className="text-[#80949b] text-xs">₹</span>
                              <input type="number" value={wp.price || ""} onChange={(e) => { const wps = [...(form.weightPrices || [])]; wps[i] = { ...wps[i], price: +e.target.value }; setForm({ ...form, weightPrices: wps }); }} className="w-16 rounded-lg border border-border px-2 py-1.5 text-xs outline-none" placeholder="Price" />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="rounded-lg bg-brand-fresh px-4 py-2 text-xs font-bold text-white"><Save className="h-3 w-3" /></button>
                          <button onClick={() => setEditingId(null)} className="rounded-lg border border-border px-4 py-2 text-xs text-muted"><X className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 capitalize text-muted">{p.category}</td>
                    <td className="px-4 py-3">₹{p.price}</td>
                    <td className="px-4 py-3">{p.discount ? `${p.discount}%` : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-muted hover:bg-surface"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-brand-red hover:bg-brand-red/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
