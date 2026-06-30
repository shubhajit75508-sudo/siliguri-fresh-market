"use client";

import { useMemo, useEffect } from "react";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Truck,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { useOrderStore } from "@/store/order-store";
import { useAuthStore } from "@/store/auth-store";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboard() {
  const { getStats, orders, loaded, loadOrders } = useOrderStore();

  useEffect(() => { loadOrders(); }, [loadOrders]);
  const { users } = useAuthStore();

  const stats = useMemo(() => getStats(), [orders]);

  const today = new Date().toDateString();
  const newCustomersToday = users.filter(
    (u) => u.createdAt && new Date(u.createdAt).toDateString() === today
  ).length;
  const conversion = stats.ordersToday > 0 ? Math.round((stats.ordersToday / Math.max(newCustomersToday, 1)) * 100) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      <p className="text-sm text-muted">
        {stats.totalOrders} total orders · {stats.pendingOrders} pending
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue Today" value={formatPrice(stats.revenueToday)} change={0} icon={IndianRupee} color="bg-brand-dark" />
        <StatCard title="Orders Today" value={stats.ordersToday.toString()} change={0} icon={ShoppingCart} color="bg-brand-blue" />
        <StatCard title="New Customers" value={newCustomersToday.toString()} change={0} icon={Users} color="bg-brand-fresh" />
        <StatCard title="Conversion Rate" value={`${conversion}%`} change={0} icon={TrendingUp} color="bg-brand-orange" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Top Categories</h3>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-light">No data yet. Data will appear once orders are placed.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {Object.entries(
                orders.reduce<Record<string, number>>((acc, o) => {
                  o.items.forEach((i) => {
                    const cat = i.product.category || "other";
                    acc[cat] = (acc[cat] || 0) + i.quantity;
                  });
                  return acc;
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, qty]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{cat}</span>
                    <span className="font-medium text-[#c2d0c9]">{qty} sold</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Active Deliveries" value={stats.activeDeliveries.toString()} change={0} icon={Truck} color="bg-brand-blue" />
        <StatCard title="Pending Orders" value={stats.pendingOrders.toString()} change={0} icon={Package} color="bg-brand-fresh" />
        <StatCard title="Total Orders" value={stats.totalOrders.toString()} change={0} icon={Users} color="bg-brand-purple" />
      </div>
    </div>
  );
}