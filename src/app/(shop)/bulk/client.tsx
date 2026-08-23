"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Package,
  Search,
  Minus,
  Plus,
  Send,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Building2,
  UtensilsCrossed,
  ChefHat,
  Heart,
  PartyPopper,
  HandPlatter,
  X,
  Check,
} from "lucide-react";
import { useProducts } from "@/lib/hooks/use-products";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const STORE_PHONE = "917029908278";
const STORE_PHONE_2 = "919832966112";

const OCCASIONS = [
  { value: "hotel", label: "Hotel", icon: Building2 },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "catering", label: "Catering", icon: HandPlatter },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "festival", label: "Festival", icon: PartyPopper },
  { value: "other", label: "Other", icon: ChefHat },
] as const;

const CATEGORY_FILTERS = [
  { value: "all", label: "All Items" },
  { value: "fish", label: "Fish" },
  { value: "chicken", label: "Chicken" },
  { value: "mutton", label: "Mutton" },
  { value: "pork", label: "Pork" },
  { value: "seafood", label: "Seafood" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "eggs", label: "Eggs" },
  { value: "dairy", label: "Dairy" },
] as const;

const TIME_SLOTS = [
  "Morning (7 AM \u2013 10 AM)",
  "Midday (10 AM \u2013 1 PM)",
  "Afternoon (1 PM \u2013 4 PM)",
];

function getMinDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getMaxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

function buildBulkMessage(
  occasion: string,
  items: Map<string, { product: Product; qty: number }>,
  deliveryDate: string,
  timeSlot: string,
  address: string,
  contactName: string,
  contactPhone: string,
  notes: string,
): string {
  const lines: string[] = [];
  lines.push("\u{1F6D2} BULK ORDER ENQUIRY");
  lines.push("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");

  const occasionLabel = OCCASIONS.find((o) => o.value === occasion)?.label || occasion;
  lines.push(`Occasion: ${occasionLabel}`);
  if (contactName) lines.push(`Contact: ${contactName}`);
  if (contactPhone) lines.push(`Phone: ${contactPhone}`);
  lines.push("");

  lines.push("\u{1F4E6} ITEMS:");
  let idx = 0;
  items.forEach(({ product, qty }) => {
    idx++;
    lines.push(
      `${idx}. ${product.name} (${product.unit}) \u2014 ${qty} ${product.unit}`,
    );
  });

  if (deliveryDate) {
    const formatted = new Date(deliveryDate + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    lines.push(`\u{1F4C5} Delivery: ${formatted}${timeSlot ? ", " + timeSlot : ""}`);
  }
  if (address) lines.push(`\u{1F4CD} Address: ${address}`);
  if (notes) lines.push(`\u{1F4DD} Note: ${notes}`);

  lines.push("");
  lines.push("\u{1F4B3} Payment: COD (Cash on Delivery) preferred");
  lines.push("Please share your best wholesale prices for the above items.");

  return lines.join("\n");
}

export function BulkOrderClient() {
  const { data: products = [], isLoading } = useProducts();

  const [occasion, setOccasion] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [deliveryDate, setDeliveryDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.inStock) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categoryFilter, searchQuery]);

  const selectedItems = useMemo(() => {
    const map = new Map<string, { product: Product; qty: number }>();
    quantities.forEach((qty, productId) => {
      if (qty > 0) {
        const product = products.find((p) => p.id === productId);
        if (product) map.set(productId, { product, qty });
      }
    });
    return map;
  }, [quantities, products]);

  const selectedCount = selectedItems.size;

  const setQty = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const next = new Map(prev);
      const current = next.get(productId) || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        next.delete(productId);
      } else {
        next.set(productId, nextQty);
      }
      return next;
    });
  };

  const handleSend = () => {
    const msg = buildBulkMessage(
      occasion,
      selectedItems,
      deliveryDate,
      timeSlot,
      address,
      contactName,
      contactPhone,
      notes,
    );
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${STORE_PHONE}?text=${encoded}`, "_blank");
    setTimeout(() => {
      window.open(`https://wa.me/${STORE_PHONE_2}?text=${encoded}`, "_blank");
    }, 1500);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const isFormValid =
    occasion && selectedCount > 0 && deliveryDate && timeSlot && address && contactName && contactPhone;

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-10">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white sm:p-10">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Package className="h-3.5 w-3.5" />
            Bulk Orders
          </div>
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            Fresh Fish & Meat in Bulk
          </h1>
          <p className="max-w-lg text-sm text-white/80 sm:text-base">
            Perfect for hotels, restaurants, catering, weddings, and festivals.
            Browse our fresh catalog, select your items, and we&apos;ll deliver
            straight to your kitchen in Siliguri.
          </p>
        </div>
      </div>

      {/* Step 1: Occasion */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          1. What&apos;s the occasion?
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {OCCASIONS.map((o) => {
            const Icon = o.icon;
            const active = occasion === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setOccasion(o.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all sm:p-4 sm:text-sm",
                  active
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-border bg-white text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50",
                )}
              >
                <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", active ? "text-emerald-600" : "")} />
                {o.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Product Catalog */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            2. Select your items
          </h2>
          {selectedCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Search + Category Filter */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map((cf) => (
              <button
                key={cf.value}
                onClick={() => setCategoryFilter(cf.value)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  categoryFilter === cf.value
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-white text-muted-foreground hover:border-emerald-300",
                )}
              >
                {cf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No products found. Try a different search or category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredProducts.map((product) => {
              const qty = quantities.get(product.id) || 0;
              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-white p-3 transition-all",
                    qty > 0
                      ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
                      : "border-border hover:border-emerald-200",
                  )}
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {qty > 0 ? (
                      <>
                        <button
                          onClick={() => setQty(product.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                        <button
                          onClick={() => setQty(product.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setQty(product.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Items Summary Bar */}
      {selectedCount > 0 && (
        <div
          ref={summaryRef}
          className="sticky bottom-20 z-30 mb-8 rounded-xl border border-emerald-200 bg-white p-4 shadow-lg sm:bottom-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              Continue
              {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Selected items list */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Array.from(selectedItems.values()).map(({ product, qty }) => (
              <span
                key={product.id}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
              >
                {product.name} x{qty}
                <button
                  onClick={() => setQty(product.id, -qty)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Delivery Details Form */}
      {showForm && (
        <section className="mb-8 rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            3. Delivery details
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Contact Name */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Contact Name *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Delivery Date *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                1 to 3 days from today
              </p>
            </div>

            {/* Time Slot */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Preferred Time *
              </label>
              <div className="flex flex-col gap-1.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-all",
                      timeSlot === slot
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-medium"
                        : "border-border bg-white text-muted-foreground hover:border-emerald-300",
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Delivery Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full delivery address in Siliguri"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. skinless chicken, cleaned fish, specific cuts, packaging requirements..."
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Send Button */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to WhatsApp with your order details.
              Pricing will be confirmed by our team.
            </p>
            <button
              onClick={handleSend}
              disabled={!isFormValid}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                isFormValid
                  ? "bg-[#25D366] text-white shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:bg-[#20BA5C] hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)] active:scale-95"
                  : "cursor-not-allowed bg-gray-200 text-gray-400",
              )}
            >
              <svg viewBox="0 0 32 32" fill="currentColor" className="h-5 w-5">
                <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.054 9.374L1.054 31.25l6.098-1.97A15.906 15.906 0 0016.004 32C24.83 32 32 24.822 32 16S24.83 0 16.004 0zm9.308 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.84.18-1.938.324-5.636-1.21-4.736-1.966-7.78-6.81-8.016-7.126-.226-.316-1.896-2.524-1.896-4.814s1.2-3.41 1.63-3.878c.39-.424.936-.572 1.248-.572.152 0 .29.008.416.014.434.018.65.044.936.716.35.84 1.198 2.924 1.302 3.138.104.214.214.52.064.834-.138.326-.258.526-.472.814-.214.288-.42.512-.634.822-.194.276-.41.572-.17.996.238.424 1.06 1.75 2.274 2.836 1.562 1.396 2.838 1.83 3.288 2.036.336.154.734.092.994-.276.332-.468.74-1.236 1.15-1.982.294-.534.666-.6 1.132-.404.378.158 2.398 1.132 2.81 1.338.414.206.69.31.794.484.104.174.104 1.006-.286 2.106z" />
              </svg>
              Send Order on WhatsApp
            </button>
          </div>
        </section>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg sm:bottom-20 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Order sent on WhatsApp!
          </div>
        </div>
      )}
    </div>
  );
}
