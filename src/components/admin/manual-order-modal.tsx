"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { X, Plus, Trash2, Loader2, MapPin, Search, User, Phone, Mail, Package, IndianRupee, MessageCircle, CheckCircle } from "lucide-react";
import { formatPrice, getAvailableWeights, getPriceForWeight, getItemLineTotal } from "@/lib/utils";
import { DELIVERY_ZONES } from "@/lib/zones";
import { useToast } from "@/components/ui/toaster";
import type { Product, CartItem } from "@/types";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), { ssr: false });

const HUB: [number, number] = [26.692365, 88.42275];

interface ManualOrderModalProps {
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}

interface ManualItem {
  product: Product;
  quantity: number;
  selectedWeight?: string;
  selectedCut?: string;
  selectedCleaning?: string;
  unitPrice: number;
}

export default function ManualOrderModal({ products, onClose, onSaved }: ManualOrderModalProps) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ManualItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [line1, setLine1] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Siliguri");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [extraLabel, setExtraLabel] = useState("");
  const [extraAmount, setExtraAmount] = useState("0");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category?.includes(q));
  }, [products, search]);

  const subtotal = items.reduce((sum, i) => sum + getItemLineTotal(i), 0);
  const deliveryFeeNum = Math.max(0, Number(deliveryFee) || 0);
  const extraNum = Math.max(0, Number(extraAmount) || 0);
  const total = subtotal + deliveryFeeNum + extraNum;
  const valid =
    customerName.trim().length > 0 &&
    customerPhone.trim().length >= 10 &&
    items.length > 0 &&
    total > 0 &&
    line1.trim().length > 0;

  const addItem = (p: Product) => {
    const weights = p.weightPrices?.map((w) => w.weight) ?? getAvailableWeights(p.price, p.category, p.weight, p.weightPrices);
    const w = weights[0];
    setItems((prev) => [...prev, { product: p, quantity: 1, selectedWeight: w, unitPrice: getPriceForWeight(p.price, w, p.weightPrices) }]);
  };

  const updateItem = (idx: number, patch: Partial<ManualItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const toCartItems = (): CartItem[] =>
    items.map((i) => ({
      product: i.product,
      quantity: i.quantity,
      selectedWeight: i.selectedWeight,
      selectedCut: i.selectedCut,
      selectedCleaning: i.selectedCleaning,
    }));

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const id = "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          items: toCartItems(),
          total: Math.round(total * 100) / 100,
          subtotal: Math.round(subtotal * 100) / 100,
          delivery_fee: deliveryFeeNum,
          extra_charges: extraNum,
          order_source: "manual",
          order_notes: orderNotes || (extraLabel ? `Extra charge: ${extraLabel} ${formatPrice(extraNum)}` : ""),
          delivery_slot: deliverySlot || null,
          status: "received",
          delivery_status: "pending",
          payment_method: paymentMethod,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          address_snapshot: {
            id: id + "-addr",
            label: "Delivery",
            line1,
            area: area || undefined,
            landmark: landmark || undefined,
            city,
            pincode,
            lat: lat ?? undefined,
            lng: lng ?? undefined,
            isDefault: false,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order creation failed");
      }
      toast.add("Manual order created — assign a delivery partner in Route Planner", "success");
      onSaved();
      onClose();
    } catch (e) {
      toast.add(e instanceof Error ? e.message : "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-fresh/15">
              <MessageCircle className="h-5 w-5 text-brand-fresh" />
            </div>
            <div>
              <p className="text-sm font-bold">New Manual Order</p>
              <p className="text-[11px] text-muted">WhatsApp · call · offline — not from the website</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Customer ── */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Customer</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <User className="h-4 w-4 shrink-0 text-muted" />
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name *" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <Phone className="h-4 w-4 shrink-0 text-muted" />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number *" inputMode="tel" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 sm:col-span-2">
              <Mail className="h-4 w-4 shrink-0 text-muted" />
              <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (optional)" inputMode="email" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
          </div>
        </div>

        {/* ── Address + Pin on map ── */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Delivery Address</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 sm:col-span-2">
              <MapPin className="h-4 w-4 shrink-0 text-muted" />
              <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1 *" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (e.g. Shantipara)" list="manual-zones" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
              <datalist id="manual-zones">
                {DELIVERY_ZONES.map((z) => <option key={z.slug} value={z.name} />)}
              </datalist>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark (optional)" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" inputMode="numeric" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <LiveMap
              center={lat && lng ? [lat, lng] : HUB}
              zoom={12}
              onMapClick={(la, ln) => { setLat(la); setLng(ln); }}
              markers={lat && lng ? [{ position: [lat, lng], icon: "customer", label: "Delivery location" }] : [{ position: HUB, icon: "store", label: "Hub — tap map to pin delivery" }]}
              className="h-44 w-full"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>Tap on the map to pin the exact delivery point.</span>
            {lat !== null && lng !== null && (
              <span className="rounded bg-brand-fresh/10 px-2 py-0.5 font-mono font-semibold text-brand-fresh">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        {/* ── Products ── */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Products</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products to add…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
          </div>
          <div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted">No products match.</p>}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm hover:border-brand-fresh/40 hover:bg-brand-fresh/5"
              >
                {p.image ? (
                  <img src={p.image} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5"><Package className="h-4 w-4 text-muted" /></div>
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <span className="shrink-0 text-xs text-muted">{formatPrice(p.price)}/{p.unit || "kg"}</span>
                <Plus className="h-4 w-4 shrink-0 text-brand-fresh" />
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {items.map((it, idx) => {
                const weights = it.product.weightPrices?.map((w) => w.weight) ?? getAvailableWeights(it.product.price, it.product.category, it.product.weight, it.product.weightPrices);
                return (
                  <div key={idx} className="rounded-xl border border-border bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {it.product.image ? (
                          <img src={it.product.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface"><Package className="h-4 w-4 text-muted" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{it.product.name}</p>
                          <p className="text-[11px] text-muted">{formatPrice(it.unitPrice)} each</p>
                        </div>
                      </div>
                      <button onClick={() => removeItem(idx)} className="rounded-lg p-1 text-brand-red hover:bg-brand-red/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        value={it.selectedWeight ?? ""}
                        onChange={(e) => updateItem(idx, { selectedWeight: e.target.value || undefined, unitPrice: getPriceForWeight(it.product.price, e.target.value || undefined, it.product.weightPrices) })}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs outline-none"
                      >
                        {(it.product.weightPrices?.length ? it.product.weightPrices.map((w) => w.weight) : weights).map((w) => (
                          <option key={w} value={w}>{w}{it.product.weightPrices ? ` · ${formatPrice(getPriceForWeight(it.product.price, w, it.product.weightPrices))}` : ""}</option>
                        ))}
                      </select>
                      {it.product.cuts && it.product.cuts.length > 0 && (
                        <select value={it.selectedCut ?? ""} onChange={(e) => updateItem(idx, { selectedCut: e.target.value || undefined })} className="rounded-lg border border-border bg-surface px-2 py-1 text-xs outline-none">
                          <option value="">Cut: Any</option>
                          {it.product.cuts.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      {it.product.cleaningOptions && it.product.cleaningOptions.length > 0 && (
                        <select value={it.selectedCleaning ?? ""} onChange={(e) => updateItem(idx, { selectedCleaning: e.target.value || undefined })} className="rounded-lg border border-border bg-surface px-2 py-1 text-xs outline-none">
                          <option value="">Cleaning: Any</option>
                          {it.product.cleaningOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => updateItem(idx, { quantity: Math.max(1, it.quantity - 1) })} className="h-7 w-7 rounded-lg border border-border text-sm font-bold hover:bg-white/5">−</button>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-12 rounded-lg border border-border bg-surface px-2 py-1 text-center text-sm outline-none"
                        />
                        <button onClick={() => updateItem(idx, { quantity: it.quantity + 1 })} className="h-7 w-7 rounded-lg border border-border text-sm font-bold hover:bg-white/5">+</button>
                        <span className="w-16 text-right text-sm font-bold">{formatPrice(getItemLineTotal(it))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Charges ── */}
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Charges & Payment</p>
          <div className="mt-2 space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                <IndianRupee className="h-4 w-4 shrink-0 text-muted" />
                <input type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="Delivery fee" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                <input value={extraLabel} onChange={(e) => setExtraLabel(e.target.value)} placeholder="Extra label (e.g. packaging)" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                <IndianRupee className="h-4 w-4 shrink-0 text-muted" />
                <input type="number" min={0} value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} placeholder="Extra amount" className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "cod" | "upi")} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none">
                <option value="cod">Payment: COD</option>
                <option value="upi">Payment: UPI (collect later)</option>
              </select>
              <input value={deliverySlot} onChange={(e) => setDeliverySlot(e.target.value)} placeholder="Delivery slot (optional, e.g. 9–12)" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-muted/50" />
            </div>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={1} placeholder="Notes (optional)" className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-muted/50" />
          </div>
        </div>

        {/* ── Total & submit ── */}
        <div className="mt-5 rounded-xl border border-border bg-white/5 p-3 text-sm">
          <div className="flex justify-between text-muted"><span>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</span><span>{formatPrice(subtotal)}</span></div>
          <div className="mt-1 flex justify-between text-muted"><span>Delivery fee</span><span>{formatPrice(deliveryFeeNum)}</span></div>
          {extraNum > 0 && (
            <div className="mt-1 flex justify-between text-muted"><span>Extra {extraLabel ? `(${extraLabel})` : "charges"}</span><span>{formatPrice(extraNum)}</span></div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-extrabold">
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
        </div>

        {!valid && (
          <p className="mt-2 text-[11px] text-muted">
            {customerName.trim().length === 0 && "Add a customer name. "}
            {customerPhone.trim().length < 10 && "Add a 10-digit phone. "}
            {line1.trim().length === 0 && "Add an address line. "}
            {items.length === 0 && "Add at least one product. "}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-fresh px-6 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:bg-brand-fresh/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {saving ? "Creating…" : `Create ${paymentMethod === "cod" ? "COD" : "UPI"} order`}
          </button>
          <button onClick={onClose} className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted hover:bg-white/5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}