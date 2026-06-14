"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
export default function CustomersPage() {
  const { users } = useAuthStore();
  const { orders, loadOrders } = useOrderStore();
  const [remoteCustomers, setRemoteCustomers] = useState<Record<string, unknown>[]>([]);

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch("/api/admin/customers", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setRemoteCustomers(json.customers ?? []))
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const customers = useMemo(() => {
    const seen = new Set<string>();
    const result: {
      id: string; name: string; email: string; phone: string;
      orderCount: number; totalSpent: number; createdAt: string;
    }[] = [];

    const addIfNew = (email: string, data: { id: string; name: string; phone: string; createdAt: string }) => {
      if (!email || seen.has(email)) return;
      seen.add(email);
      const customerOrders = orders.filter((o) => o.customerEmail === email);
      result.push({
        id: data.id,
        name: data.name || email.split("@")[0],
        email,
        phone: data.phone || "",
        orderCount: customerOrders.length,
        totalSpent: customerOrders.reduce((sum, o) => sum + o.total, 0),
        createdAt: data.createdAt || "",
      });
    };

    // 1. Local auth users with customer role
    for (const u of users) {
      if (u.role !== "customer") continue;
      addIfNew(u.email, { id: u.id, name: u.name, phone: u.phone, createdAt: u.createdAt });
    }

    // 2. Remote customers (from Supabase)
    for (const r of remoteCustomers) {
      const email = r.email as string;
      addIfNew(email, {
        id: r.id as string,
        name: (r.name as string) ?? email?.split("@")[0] ?? "Unknown",
        phone: (r.phone as string) ?? "",
        createdAt: (r.created_at as string) ?? "",
      });
    }

    // 3. Customers extracted from orders (anyone who placed an order)
    for (const o of orders) {
      addIfNew(o.customerEmail, {
        id: o.id,
        name: o.customerName,
        phone: o.customerPhone,
        createdAt: o.createdAt,
      });
    }

    return result;
  }, [users, orders, remoteCustomers]);

  return (
    <div>
      <h2 className="text-2xl font-bold">Customers</h2>
      <p className="text-sm text-muted">{customers.length} customers</p>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 font-medium text-gray-500">Orders</th>
              <th className="px-4 py-3 font-medium text-gray-500">Total Spent</th>
              <th className="px-4 py-3 font-medium text-gray-500">Member Since</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No customers yet.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.email}</td>
                  <td className="px-4 py-3 text-muted">{c.phone}</td>
                  <td className="px-4 py-3">{c.orderCount}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="fresh">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "N/A"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
