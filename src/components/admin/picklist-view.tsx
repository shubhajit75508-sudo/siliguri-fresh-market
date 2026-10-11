"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, ClipboardList, Layers, List, Package, Truck } from "lucide-react";
import { formatPrice, getItemUnitPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import type { Order, CartItem } from "@/types";

interface PicklistViewProps {
  orders: Order[];
  onBack: () => void;
}

type GroupRow = {
  key: string;
  product: CartItem["product"];
  weight?: string;
  cut?: string;
  cleaning?: string;
  quantity: number;
  orderIds: string[];
};

const itemKey = (it: CartItem) =>
  [it.product.id, it.selectedWeight ?? "", it.selectedCut ?? "", it.selectedCleaning ?? ""].join("|");

export default function PicklistView({ orders, onBack }: PicklistViewProps) {
  const toast = useToast();
  const [mode, setMode] = useState<"product" | "order">("product");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const unassigned = useMemo(
    () => orders.filter((o) => o.status === "received" && !o.deliveryBoyId),
    [orders]
  );

  const totalItems = unassigned.reduce((n, o) => n + o.items.reduce((m, i) => m + (i.quantity || 1), 0), 0);

  const grouped = useMemo(() => {
    const rows = new Map<string, GroupRow>();
    for (const o of unassigned) {
      for (const it of o.items) {
        const key = itemKey(it);
        const existing = rows.get(key);
        if (existing) {
          existing.quantity += it.quantity || 1;
          if (!existing.orderIds.includes(o.id)) existing.orderIds.push(o.id);
        } else {
          rows.set(key, {
            key,
            product: it.product,
            weight: it.selectedWeight,
            cut: it.selectedCut,
            cleaning: it.selectedCleaning,
            quantity: it.quantity || 1,
            orderIds: [o.id],
          });
        }
      }
    }
    return [...rows.values()].sort(
      (a, b) => b.quantity - a.quantity || a.product.name.localeCompare(b.product.name)
    );
  }, [unassigned]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const qtyForOrder = (row: GroupRow, orderId: string) => {
    const o = unassigned.find((x) => x.id === orderId);
    if (!o) return 0;
    return o.items.filter((it) => itemKey(it) === row.key).reduce((n, i) => n + (i.quantity || 1), 0);
  };

  const copyText = () => {
    const lines = grouped.map(
      (g, idx) =>
        `${idx + 1}. ${g.quantity} × ${g.product.name}${g.weight ? ` (${g.weight})` : ""}${g.cut ? ` [${g.cut}]` : ""}${g.cleaning ? ` [${g.cleaning}]` : ""}`
    );
    const text = [
      `TO PACK — ${unassigned.length} unassigned order(s), ${totalItems} items`,
      ...lines,
      "",
      `Orders: ${unassigned.map((o) => o.id).join(", ")}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(
      () => toast.add("Pick list copied", "success"),
      () => toast.add("Could not copy", "error")
    );
  };

  if (unassigned.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-fresh/10">
          <Truck className="h-6 w-6 text-brand-fresh" />
        </div>
        <p className="text-sm font-semibold">Nothing to pack right now.</p>
        <p className="text-xs text-muted">All pending orders have been assigned to a delivery partner, or there are no open orders.</p>
        <button onClick={onBack} className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-white/5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-fresh/15">
            <Package className="h-5 w-5 text-brand-fresh" />
          </div>
          <div>
            <p className="text-sm font-bold">To Pack — all items before delivery partners pick up</p>
            <p className="text-[11px] text-muted">{unassigned.length} unassigned orders · {grouped.length} unique product lines · {totalItems} items</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-border">
            <button
              onClick={() => setMode("product")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${mode === "product" ? "bg-brand-dark text-white" : "text-muted hover:bg-white/5"}`}
            >
              <Layers className="h-3.5 w-3.5" /> By product
            </button>
            <button
              onClick={() => setMode("order")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${mode === "order" ? "bg-brand-dark text-white" : "text-muted hover:bg-white/5"}`}
            >
              <List className="h-3.5 w-3.5" /> By order
            </button>
          </div>
          <button onClick={copyText} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-white/5" title="Copy pick list">
            <ClipboardList className="h-3.5 w-3.5" /> Copy list
          </button>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-white/5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </button>
        </div>
      </div>

      {mode === "product" ? (
        <div className="space-y-2">
          {grouped.map((row) => {
            const isOpen = expanded.has(row.key);
            return (
              <div key={row.key} className="overflow-hidden rounded-xl border border-border bg-surface">
                <button onClick={() => toggleExpand(row.key)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5">
                  {row.product.image ? (
                    <img src={row.product.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5"><Package className="h-4 w-4 text-muted" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.product.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {row.weight && <span className="rounded bg-brand-fresh/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-fresh">{row.weight}</span>}
                      {row.cut && <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-blue">{row.cut}</span>}
                      {row.cleaning && <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple">{row.cleaning}</span>}
                      <span className="text-[10px] text-muted">in {row.orderIds.length} order{row.orderIds.length > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-base font-extrabold text-brand-fresh">{row.quantity}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
                </button>
                {isOpen && (
                  <div className="space-y-1.5 border-t border-border bg-white/5 px-3 py-2.5">
                    {row.orderIds.map((orderId) => {
                      const o = unassigned.find((x) => x.id === orderId);
                      if (!o) return null;
                      return (
                        <div key={orderId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-mono font-semibold text-brand-fresh">{orderId}</span>
                            <span className="truncate text-muted">{o.customerName} · {o.address.area || o.address.line1}</span>
                          </div>
                          <span className="shrink-0 font-bold">{qtyForOrder(row, orderId)} × {row.product.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {unassigned.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-semibold text-brand-fresh">{o.id}</p>
                  <p className="text-sm font-medium">{o.customerName}</p>
                  <p className="text-[11px] text-muted">{o.customerPhone} · {o.address.area || o.address.line1}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm font-bold">{formatPrice(o.total)}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      {it.product.image ? (
                        <img src={it.product.image} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface"><Package className="h-3.5 w-3.5 text-muted" /></div>
                      )}
                      <span className="truncate font-medium">{it.product.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {it.selectedWeight && <span className="rounded bg-brand-fresh/10 px-1.5 py-0.5 font-semibold text-brand-fresh">{it.selectedWeight}</span>}
                      {it.selectedCut && <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 font-semibold text-brand-blue">{it.selectedCut}</span>}
                      {it.selectedCleaning && <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 font-semibold text-brand-purple">{it.selectedCleaning}</span>}
                      <span className="font-bold">{it.quantity} × {formatPrice(getItemUnitPrice(it))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}