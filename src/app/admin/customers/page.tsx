"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { Loader2 } from "lucide-react";

export default function CustomersPage() {
  const { users } = useAuthStore();
  const { orders } = useOrderStore();
  const [remoteCustomers, setRemoteCustomers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((json) => setRemoteCustomers(json.customers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customers = useMemo(() => {
    const seen = new Set<string>();
    const result: {
      id: string; name: string; email: string; phone: string;
      orderCount: number; totalSpent: number; createdAt: string;
    }[] = [];

    // Local users first
    for (const u of users) {
      if (u.role !== "customer") continue;
      if (seen.has(u.email)) continue;
      seen.add(u.email);
      const customerOrders = orders.filter((o) => o.customerEmail === u.email);
      result.push({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        orderCount: customerOrders.length,
        totalSpent: customerOrders.reduce((sum, o) => sum + o.total, 0),
        createdAt: u.createdAt,
      });
    }

    // Remote customers (from Supabase) not already in local
    for (const r of remoteCustomers) {
      const email = r.email as string;
      if (seen.has(email)) continue;
      seen.add(email);
      const customerOrders = orders.filter((o) => o.customerEmail === email);
      result.push({
        id: r.id as string,
        name: (r.name as string) ?? email.split("@")[0],
        email: email,
        phone: (r.phone as string) ?? "",
        orderCount: customerOrders.length,
        totalSpent: customerOrders.reduce((sum, o) => sum + o.total, 0),
        createdAt: (r.created_at as string) ?? "",
      });
    }

    return result;
  }, [users, orders, remoteCustomers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Customers</h2>
      <p className="text-sm text-muted">{customers.length} registered customers</p>
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
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No customers yet.
                </td>
              </tr>
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