"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";

export default function CustomersPage() {
  const { users } = useAuthStore();
  const { orders } = useOrderStore();

  const customers = useMemo(() => {
    return users
      .filter((u) => u.role === "customer")
      .map((u) => {
        const customerOrders = orders.filter((o) => o.customerEmail === u.email);
        const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
        return {
          ...u,
          orderCount: customerOrders.length,
          totalSpent,
        };
      });
  }, [users, orders]);

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