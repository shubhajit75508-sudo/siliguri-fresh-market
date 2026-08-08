"use client";

import { useState, useEffect } from "react";
import { Loader2, ShoppingBag, IndianRupee, Clock, Truck, TrendingUp, Users, Wallet, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
  deliveredRevenue: number;
  cancelledRevenue: number;
  pendingRevenue: number;
  dailyRevenue: { date: string; revenue: number; orderCount: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  ordersByHour: { hour: number; count: number }[];
  deliverySuccessRate: number;
  paymentMix: { cod: number; upi: number };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-light" /></div>;
  }

  if (!data) {
    return <div className="py-10 text-center text-sm text-muted-light">Failed to load analytics.</div>;
  }

  const cards = [
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-100" },
    { label: "Revenue (Total)", value: "₹" + data.totalRevenue.toLocaleString("en-IN"), icon: IndianRupee, color: "text-green-600 bg-green-100" },
    { label: "Orders Today", value: data.ordersToday, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
    { label: "Revenue Today", value: "₹" + data.revenueToday.toLocaleString("en-IN"), icon: IndianRupee, color: "text-emerald-600 bg-emerald-100" },
    { label: "Pending", value: data.pendingOrders, icon: Clock, color: "text-orange-600 bg-orange-100" },
    { label: "Active Deliveries", value: data.activeDeliveries, icon: Truck, color: "text-cyan-600 bg-cyan-100" },
    { label: "Delivery Success", value: data.deliverySuccessRate + "%", icon: CheckCircle2, color: "text-lime-600 bg-lime-100" },
    { label: "Customers", value: data.totalCustomers, icon: Users, color: "text-pink-600 bg-pink-100" },
  ];

  const chartLine = (key: "revenue" | "orderCount", color: string) => (
    <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
  );

  return (
    <div>
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="text-sm text-muted">Business performance at a glance</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-surface p-5 shadow-sm">
            <div className={"mb-3 inline-flex rounded-lg p-2.5 " + c.color}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="mt-0.5 text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Revenue — Last 30 Days</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: string) => v.slice(5)} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip formatter={(v) => ["₹" + Number(v).toLocaleString("en-IN"), "Revenue"]} />
                {chartLine("revenue", "#2D7D3A")}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Orders by Hour</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersByHour} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(h: number) => `${h}h`} minTickGap={10} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip formatter={(v) => [v, "Orders"]} labelFormatter={(h) => `${h}:00`} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Top Products</h3>
          <div className="mt-4 space-y-3">
            {data.topProducts.length === 0 && <p className="text-sm text-muted">No delivered orders yet.</p>}
            {data.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 shrink-0 text-xs font-bold text-muted">{i + 1}.</span>
                  <span className="truncate text-sm">{p.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold">{p.quantity} pcs</span>
                  <span className="ml-2 text-xs text-muted">₹{p.revenue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Payment Mix</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted"><Wallet className="h-4 w-4" /> Cash on Delivery</span>
              <span className="text-sm font-semibold">{data.paymentMix.cod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted"><IndianRupee className="h-4 w-4" /> UPI</span>
              <span className="text-sm font-semibold">{data.paymentMix.upi}</span>
            </div>
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="bg-orange-500"
                style={{ width: `${(data.paymentMix.cod / Math.max(1, data.paymentMix.cod + data.paymentMix.upi)) * 100}%` }}
              />
              <div
                className="bg-green-600"
                style={{ width: `${(data.paymentMix.upi / Math.max(1, data.paymentMix.cod + data.paymentMix.upi)) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>COD {Math.round((data.paymentMix.cod / Math.max(1, data.paymentMix.cod + data.paymentMix.upi)) * 100)}%</span>
              <span>UPI {Math.round((data.paymentMix.upi / Math.max(1, data.paymentMix.cod + data.paymentMix.upi)) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Orders by Status</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted">{status.replace(/_/g, " ")}</span>
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Quick Stats</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Delivered Revenue</span><span className="font-semibold">₹{data.deliveredRevenue.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-muted">Pending Revenue</span><span className="font-semibold">₹{data.pendingRevenue.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-muted">Cancelled Revenue</span><span className="font-semibold">₹{data.cancelledRevenue.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-muted">Active Deliveries</span><span className="font-semibold">{data.activeDeliveries}</span></div>
            <div className="flex justify-between"><span className="text-muted">Products in Catalog</span><span className="font-semibold">{data.totalProducts}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
