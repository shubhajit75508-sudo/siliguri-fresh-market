"use client";

import { useState, useMemo } from "react";
import { Package, Search, X } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllProducts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";
import type { Category } from "@/types";

const API_BASE = "/api/admin/products";

const CATEGORIES: { slug: Category | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "fish", label: "Fish" },
  { slug: "chicken", label: "Chicken" },
  { slug: "mutton", label: "Mutton" },
  { slug: "seafood", label: "Seafood" },
  { slug: "vegetables", label: "Vegetables" },
  { slug: "fruits", label: "Fruits" },
  { slug: "eggs", label: "Eggs" },
  { slug: "dairy", label: "Dairy" },
  { slug: "grocery", label: "Grocery" },
  { slug: "essentials", label: "Essentials" },
];

type StockFilter = "all" | "in" | "out";

export default function AdminInventoryPage() {
  const { products: storeProducts, updateProduct } = useAdminStore();
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const toast = useToast();
  const supabaseAvailable = isSupabaseConfigured();

  const { data: liveProducts } = useQuery({
    queryKey: ["products", "all"],
    queryFn: getAllProducts,
    enabled: supabaseAvailable,
  });

  const products = supabaseAvailable && liveProducts ? liveProducts : storeProducts;

  const filtered = useMemo(() => {
    let list = [...products];
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    if (stockFilter === "in") list = list.filter((p) => p.inStock);
    else if (stockFilter === "out") list = list.filter((p) => !p.inStock);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list.reverse();
  }, [products, catFilter, stockFilter, search]);

  const setStock = (id: string, val: number) => {
    setEditingStock((prev) => ({ ...prev, [id]: val }));
  };

  const saveStock = async (id: string) => {
    const stock = editingStock[id];
    if (stock === undefined) return;
    try {
      if (supabaseAvailable) {
        const res = await fetch(API_BASE, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, stock, inStock: stock > 0 }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
      }
      updateProduct(id, { stock, inStock: stock > 0 });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith("products") });
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      console.error("Stock update failed:", e);
      toast.add(e instanceof Error ? e.message : "Failed to update stock", "error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Inventory</h2>
        <p className="text-sm text-muted">Manage stock levels</p>
      </div>

      {/* Filters */}
      <div className="mb-5 space-y-3">
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCatFilter(c.slug)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                catFilter === c.slug
                  ? "bg-[#2D7D3A] text-white"
                  : "bg-surface text-muted hover:bg-surface-2"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search + stock filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-[#2D7D3A]/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex rounded-xl border border-border overflow-hidden text-xs font-semibold">
            {(["all", "in", "out"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStockFilter(s)}
                className={`px-3.5 py-2 transition-colors ${
                  stockFilter === s
                    ? "bg-[#2D7D3A] text-white"
                    : "bg-white text-muted hover:bg-surface"
                } ${s === "all" ? "" : s === "in" ? "border-x border-border" : ""}`}
              >
                {s === "all" ? "All" : s === "in" ? "In Stock" : "Out of Stock"}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted">
          {filtered.length} of {products.length} products
        </p>
      </div>

      {products.length === 0 ? (
        <div className="glass-card flex flex-col items-center rounded-2xl p-12">
          <Package className="mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No products in inventory</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center rounded-2xl p-12">
          <Search className="mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No products match your filters</p>
          <button onClick={() => { setCatFilter("all"); setStockFilter("all"); setSearch(""); }} className="mt-2 text-xs text-[#2D7D3A] font-semibold underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isEditing = editingStock[p.id] !== undefined;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 capitalize text-muted">{p.category}</td>
                    <td className="px-4 py-3">₹{p.price}</td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editingStock[p.id]}
                          onChange={(e) => setStock(p.id, +e.target.value)}
                          className="w-20 rounded-lg border border-border px-3 py-1.5 text-center text-sm outline-none focus:border-brand-fresh/40"
                        />
                      ) : (
                        <span className={`font-semibold ${p.stock !== undefined && p.stock <= 5 ? "text-brand-red" : ""}`}>
                          {p.stock ?? "∞"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        p.inStock
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => saveStock(p.id)}
                          className="rounded-lg bg-brand-fresh px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-fresh-dim"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => setStock(p.id, p.stock ?? 0)}
                          className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted hover:bg-surface"
                        >
                          Edit Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
