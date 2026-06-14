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
    queryClient.invalidateQueries({ queryKey: ["products"] });
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
          <h3 className="mb-4 font-bold">New Product</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Price (₹)" type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <input placeholder="Image URL" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40" />
            <select value={form.category || "fish"} onChange={(e) => setForm({ ...form, category: e.target.value as import("@/types").Category })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40">
              <option value="fish">Fish</option>
              <option value="chicken">Chicken</option>
              <option value="mutton">Mutton</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="dairy">Dairy & Eggs</option>
            </select>
            <input placeholder="Discount % (0)" type="number" value={form.discount || 0} onChange={(e) => setForm({ ...form, discount: +e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40 sm:col-span-2" />
            <textarea placeholder="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-fresh/40 sm:col-span-2" rows={3} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={saveAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand-fresh px-5 py-2 text-sm font-bold text-white hover:bg-brand-fresh-dim">
              <Save className="h-4 w-4" /> Save
            </button>
            <button onClick={() => { setAdding(false); setForm({}); }} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:bg-surface">
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
