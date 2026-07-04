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
  XCircle,
  CheckCircle,
  Clock,
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

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");
  const pendingOrders = orders.filter((o) => o.status === "received" && !o.deliveryBoyId);
  const todayDeliveries = orders.filter(
    (o) => o.status === "out_for_delivery" || (o.status === "received" && !!o.deliveryBoyId)
  );

  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0);
  const cancelledRevenue = cancelledOrders.reduce((s, o) => s + o.total, 0);
  const pendingRevenueTotal = pendingOrders.reduce((s, o) => s + o.total, 0);

  const topProducts = useMemo(() => {
    const acc: Record<string, { name: string; qty: number; revenue: number }> = {};
    deliveredOrders.forEach((o) => {
      o.items.forEach((i) => {
        const key = i.product.id;
        if (!acc[key]) acc[key] = { name: i.product.name, qty: 0, revenue: 0 };
        acc[key].qty += i.quantity;
        acc[key].revenue += i.product.price * i.quantity;
      });
    });
    return Object.values(acc).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      <p className="text-sm text-muted">
        {stats.totalOrders} total · {deliveredOrders.length} delivered · {cancelledOrders.length} cancelled · {pendingOrders.length} pending
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Delivered Revenue" value={formatPrice(deliveredRevenue)} change={0} icon={IndianRupee} color="bg-brand-dark" />
        <StatCard title="Orders Today" value={stats.ordersToday.toString()} change={0} icon={ShoppingCart} color="bg-brand-blue" />
        <StatCard title="New Customers" value={newCustomersToday.toString()} change={0} icon={Users} color="bg-brand-fresh" />
        <StatCard title="Conversion Rate" value={`${conversion}%`} change={0} icon={TrendingUp} color="bg-brand-orange" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-light">No data yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-xs font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.qty} sold · {formatPrice(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-fresh/10">
              <CheckCircle className="h-5 w-5 text-brand-fresh" />
            </div>
            <div>
              <p className="text-xs text-muted">Delivered Revenue</p>
              <p className="text-lg font-bold text-brand-fresh">{formatPrice(deliveredRevenue)}</p>
              <p className="text-xs text-muted">{deliveredOrders.length} orders</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
              <XCircle className="h-5 w-5 text-brand-red" />
            </div>
            <div>
              <p className="text-xs text-muted">Cancelled Revenue Loss</p>
              <p className="text-lg font-bold text-brand-red">{formatPrice(cancelledRevenue)}</p>
              <p className="text-xs text-muted">{cancelledOrders.length} orders</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
              <Clock className="h-5 w-5 text-brand-blue" />
            </div>
            <div>
              <p className="text-xs text-muted">Pending Revenue</p>
              <p className="text-lg font-bold text-brand-blue">{formatPrice(pendingRevenueTotal)}</p>
              <p className="text-xs text-muted">{pendingOrders.length} orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Deliveries */}
      <div className="mt-6">
        <h3 className="mb-3 text-lg font-bold">Today&#39;s Deliveries</h3>
        {todayDeliveries.length === 0 ? (
          <div className="rounded-xl border bg-surface p-8 text-center text-sm text-muted-light">
            No orders out for delivery right now.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayDeliveries.slice(0, 9).map((o) => (
              <div key={o.id} className="rounded-xl border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs font-bold">{o.id}</p>
                  <Truck className="h-4 w-4 text-brand-blue" />
                </div>
                <p className="mt-1 text-sm font-medium">{o.customerName}</p>
                <p className="text-xs text-muted">{o.address.area || o.address.line1}</p>
                {o.deliveryBoyName && (
                  <p className="mt-2 text-xs text-brand-fresh">Rider: {o.deliveryBoyName}</p>
                )}
                <p className="mt-1 text-xs font-bold">{formatPrice(o.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Active Deliveries" value={stats.activeDeliveries.toString()} change={0} icon={Truck} color="bg-brand-blue" />
        <StatCard title="Pending Orders" value={stats.pendingOrders.toString()} change={0} icon={Package} color="bg-brand-fresh" />
        <StatCard title="Total Orders" value={stats.totalOrders.toString()} change={0} icon={Users} color="bg-brand-purple" />
      </div>
    </div>
  );
}
