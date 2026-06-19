"use client";

import { useState, useEffect } from "react";
import { Loader2, ShoppingBag, IndianRupee, Clock, Truck, Package, TrendingUp, Users } from "lucide-react";

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  activeDeliveries: number;
  totalProducts: number;
  totalCustomers: number;
  statusCounts: Record<string, number>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  if (!data) {
    return <div className="py-10 text-center text-sm text-gray-400">Failed to load analytics.</div>;
  }

  const cards = [
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-100" },
    { label: "Revenue (Total)", value: "₹" + data.totalRevenue.toLocaleString("en-IN"), icon: IndianRupee, color: "text-green-600 bg-green-100" },
    { label: "Orders Today", value: data.ordersToday, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
    { label: "Revenue Today", value: "₹" + data.revenueToday.toLocaleString("en-IN"), icon: IndianRupee, color: "text-emerald-600 bg-emerald-100" },
    { label: "Pending", value: data.pendingOrders, icon: Clock, color: "text-orange-600 bg-orange-100" },
    { label: "Active Deliveries", value: data.activeDeliveries, icon: Truck, color: "text-cyan-600 bg-cyan-100" },
    { label: "Products", value: data.totalProducts, icon: Package, color: "text-indigo-600 bg-indigo-100" },
    { label: "Customers", value: data.totalCustomers, icon: Users, color: "text-pink-600 bg-pink-100" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="text-sm text-gray-500">Business performance at a glance</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className={"mb-3 inline-flex rounded-lg p-2.5 " + c.color}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold">Orders by Status</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-600">{status.replace(/_/g, " ")}</span>
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold">Quick Stats</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Pending Orders</span><span className="font-semibold">{data.pendingOrders}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Active Deliveries</span><span className="font-semibold">{data.activeDeliveries}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Customers</span><span className="font-semibold">{data.totalCustomers}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Products in Catalog</span><span className="font-semibold">{data.totalProducts}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
