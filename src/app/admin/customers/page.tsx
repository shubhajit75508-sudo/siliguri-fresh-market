"use client";

import { useState, useEffect, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import {
  MessageCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Phone,
  Send,
  Calendar,
  Clock,
  ShoppingBag,
  IndianRupee,
  Star,
  MapPin,
  CreditCard,
  ChevronRight,
} from "lucide-react";

const DEFAULT_MSG =
  "🐟 Today's Freshness, Delivered to Your Door.\n\nFresh Fish • Chicken • Prawns\n⏰ Save your time. Order from home.\n\n🛒 siligurifreshmart.com\n📞 7029908278";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

function waLink(phone: string, msg: string): string {
  const num = normalizePhone(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastSignInAt: string | null;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  avgOrderValue: number;
  paymentMethods: Record<string, number>;
  deliveredCount: number;
  cancelledCount: number;
  pendingCount: number;
  addresses: string[];
}

export default function CustomersPage() {
  const { users } = useAuthStore();
  const { orders, loadOrders } = useOrderStore();
  const [remoteCustomers, setRemoteCustomers] = useState<Record<string, unknown>[]>([]);
  const [template, setTemplate] = useState(DEFAULT_MSG);
  const [showTemplate, setShowTemplate] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch("/api/admin/customers", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setRemoteCustomers(json.customers ?? []))
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const customers = useMemo(() => {
    const byPhone = new Map<string, CustomerDetail>();
    const noPhone: CustomerDetail[] = [];

    const upsert = (
      data: { id: string; name: string; email: string; phone: string; createdAt: string; lastSignInAt?: string | null },
      customerOrders: { total: number; status: string; paymentMethod: string; createdAt: string; address?: { line1?: string } }[]
    ) => {
      const norm = normalizePhone(data.phone);
      const key = norm.length >= 10 ? norm : `__nophone__${data.email}`;
      const existing = byPhone.get(key);

      const orderCount = customerOrders.length;
      const totalSpent = customerOrders.reduce((s, o) => s + o.total, 0);
      const deliveredCount = customerOrders.filter((o) => o.status === "delivered").length;
      const cancelledCount = customerOrders.filter((o) => o.status === "cancelled").length;
      const pendingCount = customerOrders.filter((o) => o.status === "received" || o.status === "out_for_delivery").length;
      const avgOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;

      const paymentMethods: Record<string, number> = {};
      for (const o of customerOrders) {
        const pm = o.paymentMethod || "cod";
        paymentMethods[pm] = (paymentMethods[pm] || 0) + 1;
      }

      const dates = customerOrders.map((o) => o.createdAt).filter(Boolean).sort();
      const firstOrderDate = dates[0] || null;
      const lastOrderDate = dates[dates.length - 1] || null;

      const addresses = customerOrders
        .map((o) => o.address?.line1)
        .filter((a): a is string => !!a && typeof a === "string")
        .filter((v, i, a) => a.indexOf(v) === i);

      const entry: CustomerDetail = {
        id: existing?.id || data.id,
        name: existing?.name && existing.name !== "Unknown" ? existing.name : data.name || "Unknown",
        email: existing?.email || data.email,
        phone: existing?.phone || data.phone,
        orderCount: (existing?.orderCount ?? 0) + orderCount,
        totalSpent: (existing?.totalSpent ?? 0) + totalSpent,
        createdAt:
          !existing?.createdAt || (data.createdAt && data.createdAt < existing.createdAt)
            ? data.createdAt
            : existing?.createdAt ?? data.createdAt,
        lastSignInAt: data.lastSignInAt || existing?.lastSignInAt || null,
        firstOrderDate: firstOrderDate || existing?.firstOrderDate || null,
        lastOrderDate: lastOrderDate || existing?.lastOrderDate || null,
        avgOrderValue,
        paymentMethods,
        deliveredCount: (existing?.deliveredCount ?? 0) + deliveredCount,
        cancelledCount: (existing?.cancelledCount ?? 0) + cancelledCount,
        pendingCount: (existing?.pendingCount ?? 0) + pendingCount,
        addresses: [...(existing?.addresses ?? []), ...addresses].filter((v, i, a) => a.indexOf(v) === i),
      };
      byPhone.set(key, entry);
    };

    for (const u of users) {
      if (u.role !== "customer") continue;
      const uOrders = orders.filter((o) => o.customerEmail === u.email);
      upsert(
        { id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt, lastSignInAt: null },
        uOrders.map((o) => ({ total: o.total, status: o.status, paymentMethod: o.paymentMethod, createdAt: o.createdAt, address: o.address }))
      );
    }

    for (const r of remoteCustomers) {
      const email = r.email as string;
      const rOrders = orders.filter((o) => o.customerEmail === email);
      upsert(
        {
          id: r.id as string,
          name: ((r.name as string) ?? email?.split("@")[0] ?? "Unknown") as string,
          email,
          phone: (r.phone as string) ?? "",
          createdAt: (r.created_at as string) ?? "",
          lastSignInAt: (r.lastSignInAt as string | null) ?? null,
        },
        rOrders.map((o) => ({ total: o.total, status: o.status, paymentMethod: o.paymentMethod, createdAt: o.createdAt, address: o.address }))
      );
    }

    for (const o of orders) {
      const norm = normalizePhone(o.customerPhone);
      const key = norm.length >= 10 ? norm : `__nophone__${o.customerEmail}`;
      if (byPhone.has(key)) continue;
      upsert(
        {
          id: o.id,
          name: o.customerName,
          email: o.customerEmail,
          phone: o.customerPhone,
          createdAt: o.createdAt,
        },
        [{ total: o.total, status: o.status, paymentMethod: o.paymentMethod, createdAt: o.createdAt, address: o.address }]
      );
    }

    const all = [...byPhone.values()];
    all.sort((a, b) => {
      const at = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    return all;
  }, [users, orders, remoteCustomers]);

  const withPhone = useMemo(
    () => customers.filter((c) => normalizePhone(c.phone).length >= 10),
    [customers]
  );

  const copyNumbers = async () => {
    const text = withPhone.map((c) => normalizePhone(c.phone)).join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const copyNumbersAndMsg = async () => {
    const numbers = withPhone.map((c) => normalizePhone(c.phone)).join("\n");
    const full = `--- NUMBERS (paste into broadcast list) ---\n${numbers}\n\n--- MESSAGE (send after creating list) ---\n${template}`;
    await navigator.clipboard.writeText(full);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-sm text-muted">
            {customers.length} customers
            {withPhone.length > 0 && (
              <span className="ml-2 text-[#25D366] font-medium">
                · {withPhone.length} on WhatsApp
              </span>
            )}
          </p>
        </div>
        {withPhone.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyNumbers}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 px-3 py-2 text-xs font-bold text-[#25D366] transition-all hover:bg-[#25D366]/10"
            >
              {copiedNumbers ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedNumbers ? "Copied!" : `Copy ${withPhone.length} Numbers`}
            </button>
            <button
              onClick={copyNumbersAndMsg}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1fb954]"
            >
              {copiedMsg ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {copiedMsg ? "Copied!" : "Copy Numbers + Message"}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowTemplate(!showTemplate)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Edit WhatsApp message template
        {showTemplate ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {showTemplate && (
        <div className="mt-2 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 p-3">
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366]/30"
            placeholder="Type your daily deals message..."
          />
          <p className="mt-1 text-[11px] text-muted">
            This message opens in WhatsApp when you tap &ldquo;Send&rdquo; next to a customer.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {customers.length === 0 ? (
          <div className="rounded-xl border bg-surface p-8 text-center text-sm text-muted-light">
            No customers yet.
          </div>
        ) : (
          customers.map((c) => {
            const hasPhone = normalizePhone(c.phone).length >= 10;
            const isExpanded = expandedId === c.id;
            const topPayment = Object.entries(c.paymentMethods).sort((a, b) => b[1] - a[1])[0];
            return (
              <div key={c.id} className="rounded-xl border bg-surface shadow-sm overflow-hidden">
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#2D7D3A]/20 to-[#2D7D3A]/5 border border-[#2D7D3A]/20 flex items-center justify-center text-sm font-bold text-[#2D7D3A]">
                    {c.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{c.name}</span>
                      {hasPhone && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#25D366]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#25D366]">
                          <Phone className="h-2.5 w-2.5" /> WA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted">
                      <span>{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</span>
                      <span className="font-medium text-foreground">{formatPrice(c.totalSpent)}</span>
                      {c.lastOrderDate && (
                        <span className="hidden sm:inline">Last: {timeAgo(c.lastOrderDate)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t bg-white/30 px-4 py-3 space-y-3">
                    {/* Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 text-muted">
                        <Phone className="h-3 w-3" />
                        <span>{c.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted">
                        <span className="text-[10px]">@</span>
                        <span className="truncate">{c.email || "No email"}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-lg bg-surface-2 px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mb-0.5">
                          <Calendar className="h-3 w-3" /> Account Created
                        </div>
                        <div className="text-xs font-semibold">{formatDate(c.createdAt)}</div>
                      </div>
                      <div className="rounded-lg bg-surface-2 px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mb-0.5">
                          <Clock className="h-3 w-3" /> Last Login
                        </div>
                        <div className="text-xs font-semibold">{c.lastSignInAt ? formatDateTime(c.lastSignInAt) : "Never logged in"}</div>
                      </div>
                      <div className="rounded-lg bg-surface-2 px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mb-0.5">
                          <ShoppingBag className="h-3 w-3" /> First Order
                        </div>
                        <div className="text-xs font-semibold">{c.firstOrderDate ? formatDate(c.firstOrderDate) : "No orders yet"}</div>
                      </div>
                    </div>

                    {/* Order stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
                        <div className="text-lg font-bold text-foreground">{c.orderCount}</div>
                        <div className="text-[10px] text-muted">Total Orders</div>
                      </div>
                      <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
                        <div className="text-lg font-bold text-[#2D7D3A]">{formatPrice(c.totalSpent)}</div>
                        <div className="text-[10px] text-muted">Total Spent</div>
                      </div>
                      <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
                        <div className="text-lg font-bold text-foreground">{formatPrice(c.avgOrderValue)}</div>
                        <div className="text-[10px] text-muted">Avg Order</div>
                      </div>
                      <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold text-[#2D7D3A]">{c.deliveredCount}</span>
                          <span className="text-muted">/</span>
                          <span className="text-sm font-bold text-brand-red">{c.cancelledCount}</span>
                          {c.pendingCount > 0 && (
                            <>
                              <span className="text-muted">/</span>
                              <span className="text-sm font-bold text-amber-500">{c.pendingCount}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-muted">Done/Cancel/Pending</div>
                      </div>
                    </div>

                    {/* Payment & Address */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {topPayment && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700 font-medium">
                          <CreditCard className="h-3 w-3" />
                          {topPayment[0] === "cod" ? "COD" : "UPI"} ({topPayment[1]}x)
                        </div>
                      )}
                      {c.addresses.length > 0 && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-muted font-medium">
                          <MapPin className="h-3 w-3" />
                          {c.addresses.length} address{c.addresses.length !== 1 ? "es" : ""}
                        </div>
                      )}
                      {c.lastOrderDate && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-muted font-medium">
                          <Clock className="h-3 w-3" />
                          Last order {timeAgo(c.lastOrderDate)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {hasPhone && (
                        <a
                          href={waLink(c.phone, template)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1fb954] hover:shadow active:scale-95"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {withPhone.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 p-4">
          <h3 className="text-sm font-bold text-foreground">Quick Broadcast Guide</h3>
          <ol className="mt-2 space-y-1 text-xs text-muted list-decimal list-inside">
            <li>
              Tap <strong>&ldquo;Copy Numbers + Message&rdquo;</strong> above
            </li>
            <li>Open WhatsApp Business on your phone</li>
            <li>Go to <strong>Chats → New Broadcast</strong></li>
            <li>Paste the numbers (from the first section of what you copied)</li>
            <li>Create the broadcast list</li>
            <li>Type the message (from the second section) and send</li>
          </ol>
          <p className="mt-2 text-[11px] text-muted">
            Broadcast limit: 256 contacts per list. If you have more, create multiple lists.
          </p>
        </div>
      )}
    </div>
  );
}
