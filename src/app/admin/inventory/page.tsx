"use client";

import { useEffect, useState, useMemo } from "react";
import { Package, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { getAllProducts } from "@/lib/data";
import { useAdminStore } from "@/store/admin-store";
import type { Product, Category } from "@/types";

const API_BASE = "/api/admin/products";

const CATEGORIES: { slug: Category | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "fish", label: "Fish" },
  { slug: "chicken", label: "Chicken" },
  { slug: "mutton", label: "Mutton" },
  { slug: "pork", label: "Pork" },
  { slug: "seafood", label: "Seafood" },
  { slug: "vegetables", label: "Vegetables" },
  { slug: "fruits", label: "Fruits" },
  { slug: "eggs", label: "Eggs" },
  { slug: "dairy", label: "Dairy" },
  { slug: "grocery", label: "Grocery" },
  { slug: "essentials", label: "Essentials" },
];

type StockFilter = "all" | "in" | "out";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [search, setSearch] = useState("");
  const toast = useToast();

  const supabaseAvailable = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (supabaseAvailable) {
        try {
          const all = await getAllProducts();
          if (!cancelled) {
            setProducts(all);
            // Keep the admin store in sync with the full DB catalog. The store
            // subscription below would otherwise replace the fetched list with a
            // stale/empty localStorage cache and make products vanish.
            useAdminStore.setState({ products: all });
          }
          return;
        } catch {}
      }
      if (!cancelled) setProducts(useAdminStore.getState().products ?? []);
    };
    load();
    const unsub = useAdminStore.subscribe((state) => setProducts([...state.products]));
    return () => { cancelled = true; unsub(); };
  }, [supabaseAvailable]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    if (stockFilter === "in") list = list.filter((p) => p.inStock);
    else if (stockFilter === "out") list = list.filter((p) => !p.inStock);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, catFilter, stockFilter, search]);

  const update = async (id: string, data: Partial<Product>) => {
    // Optimistic update — both local list and the admin store cache so every
    // page (shop, inventory) stays in sync even before the DB responds.
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    useAdminStore.getState().updateProduct(id, data);

    try {
      const res = await fetch(API_BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
    } catch (e) {
      console.error("Inventory save failed:", e);
      toast.add(`Couldn't save "${data.stock !== undefined ? "stock" : "status"}" — refresh and try again`, "error");
      // Reload authoritative state from the DB so the UI doesn't stay wrong.
      getAllProducts().then(setProducts).catch(() => {});
    }
  };

  const toggleStock = (id: string, currentInStock?: boolean) => {
    const newInStock = !currentInStock;
    const newStock = newInStock ? 100 : 0;
    update(id, { inStock: newInStock, stock: newStock });
  };

  const updateStock = (id: string, raw: number) => {
    const v = clamp(raw, 0, 100);
    update(id, { stock: v, inStock: v > 0 });
  };

  const allInStock = filtered.length > 0 && filtered.every((p) => p.inStock);
  const toggleAll = () => {
    const newInStock = !allInStock;
    const newStock = newInStock ? 100 : 0;
    for (const p of filtered) {
      update(p.id, { inStock: newInStock, stock: newStock });
    }
  };

  const empty = products.length === 0;
  const emptyFiltered = !empty && filtered.length === 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Inventory</h2>
        <p className="text-sm text-muted">Manage stock levels</p>
      </div>

      <div className="mb-5 space-y-3">
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

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted">
            {filtered.length} of {products.length} products
          </p>
          {!empty && filtered.length > 1 && (
            <button
              onClick={toggleAll}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                allInStock
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {allInStock ? "Turn All OFF" : "Turn All ON"}
            </button>
          )}
        </div>
      </div>

      {empty ? (
        <div className="glass-card flex flex-col items-center rounded-2xl p-12">
          <Package className="mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No products in inventory</p>
        </div>
      ) : emptyFiltered ? (
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
                <th className="px-4 py-3 text-center">Stock (0-100)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 capitalize text-muted">{p.category}</td>
                  <td className="px-4 py-3">₹{p.price}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.stock ?? 0}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        if (isNaN(raw)) return;
                        setProducts((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, stock: clamp(raw, 0, 100), inStock: clamp(raw, 0, 100) > 0 } : x
                          )
                        );
                      }}
                      onBlur={() => updateStock(p.id, p.stock ?? 0)}
                      className="w-20 rounded-lg border border-border px-3 py-1.5 text-center text-sm font-semibold outline-none focus:border-[#2D7D3A]/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleStock(p.id, p.inStock)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                        p.inStock ? "bg-green-500" : "bg-red-300"
                      } cursor-pointer`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          p.inStock ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
