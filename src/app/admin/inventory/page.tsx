"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminInventoryPage() {
  const { products: storeProducts, updateProduct } = useAdminStore();
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});

  const { data: liveProducts } = useQuery({
    queryKey: ["products", "all"],
    queryFn: getAllProducts,
    enabled: isSupabaseConfigured(),
  });

  const products = isSupabaseConfigured() && liveProducts ? liveProducts : storeProducts;

  const setStock = (id: string, val: number) => {
    setEditingStock((prev) => ({ ...prev, [id]: val }));
  };

  const saveStock = (id: string) => {
    const stock = editingStock[id];
    if (stock === undefined) return;
    updateProduct(id, { stock });
    setEditingStock((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Inventory</h2>
        <p className="text-sm text-muted">Manage stock levels</p>
      </div>

      {products.length === 0 ? (
        <div className="glass-card flex flex-col items-center rounded-2xl p-12">
          <Package className="mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No products in inventory</p>
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
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
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
