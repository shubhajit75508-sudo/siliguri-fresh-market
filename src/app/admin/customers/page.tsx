"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const DEFAULT_MSG =
  "🐟 Fresh fish, 🍗 chicken & 🦐 prawns available today! Order now: siligurifreshmart.com 📞7029908278";

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

export default function CustomersPage() {
  const { users } = useAuthStore();
  const { orders, loadOrders } = useOrderStore();
  const [remoteCustomers, setRemoteCustomers] = useState<Record<string, unknown>[]>([]);
  const [template, setTemplate] = useState(DEFAULT_MSG);
  const [showTemplate, setShowTemplate] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

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
    const byPhone = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        orderCount: number;
        totalSpent: number;
        createdAt: string;
      }
    >();
    const noPhone: typeof byPhone extends Map<string, infer V> ? V[] : never = [];

    const upsert = (
      data: { id: string; name: string; email: string; phone: string; createdAt: string },
      customerOrders: { total: number }[]
    ) => {
      const norm = normalizePhone(data.phone);
      const key = norm.length >= 10 ? norm : `__nophone__${data.email}`;
      const existing = byPhone.get(key);
      const orderCount = customerOrders.length;
      const totalSpent = customerOrders.reduce((s, o) => s + o.total, 0);
      const entry = {
        id: existing?.id || data.id,
        name: existing?.name && existing.name !== "Unknown" ? existing.name : data.name || "Unknown",
        email: existing?.email || data.email,
        phone: existing?.phone || data.phone,
        orderCount: (existing?.orderCount ?? 0) + orderCount,
        totalSpent: (existing?.totalSpent ?? 0) + totalSpent,
        createdAt:
          !existing?.createdAt || (data.createdAt && data.createdAt < existing.createdAt)
            ? existing?.createdAt ?? data.createdAt
            : data.createdAt,
      };
      byPhone.set(key, entry);
    };

    for (const u of users) {
      if (u.role !== "customer") continue;
      const uOrders = orders.filter((o) => o.customerEmail === u.email);
      upsert(
        { id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt },
        uOrders
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
        },
        rOrders
      );
    }

    for (const o of orders) {
      const oOrders = orders.filter((x) => x.customerEmail === o.customerEmail);
      upsert(
        {
          id: o.id,
          name: o.customerName,
          email: o.customerEmail,
          phone: o.customerPhone,
          createdAt: o.createdAt,
        },
        oOrders
      );
    }

    const all = [...byPhone.values()];
    all.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

      <div className="mt-6 overflow-x-auto rounded-xl border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-white/5 text-left">
              <th className="px-4 py-3 font-medium text-muted">Name</th>
              <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium text-muted">Phone</th>
              <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">Orders</th>
              <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">Total</th>
              <th className="px-4 py-3 font-medium text-muted text-right">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-light">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const hasPhone = normalizePhone(c.phone).length >= 10;
                return (
                  <tr key={c.id} className="border-b hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="font-medium">{c.name}</span>
                      <span className="sm:hidden ml-1 text-xs text-muted">
                        {c.orderCount} orders
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted hidden sm:table-cell">{c.email}</td>
                    <td className="px-4 py-3">
                      {hasPhone ? (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Phone className="h-3 w-3 text-[#25D366]" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-muted-light italic text-xs">No phone</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{c.orderCount}</td>
                    <td className="px-4 py-3 font-medium hidden sm:table-cell">
                      {formatPrice(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasPhone ? (
                        <a
                          href={waLink(c.phone, template)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1fb954] hover:shadow active:scale-95"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Send</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-light italic">No number</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
