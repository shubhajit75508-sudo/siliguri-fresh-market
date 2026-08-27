"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ShoppingBag, IndianRupee, Clock, Truck, TrendingUp, Users, Wallet, CheckCircle2, BarChart3, Target, Percent, PackageOpen } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Legend } from "recharts";

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

interface ProfitData {
  summary: { revenue: number; cost: number; profit: number; deliveryFees: number; orderCount: number; margin: number };
  daily: { date: string; revenue: number; cost: number; profit: number; orderCount: number }[];
  topProducts: { name: string; quantity: number; revenue: number; cost: number; profit: number }[];
  paymentMix: { cod: { revenue: number; profit: number }; upi: { revenue: number; profit: number } };
  dateRange: { from: string | null; to: string | null };
}

type Tab = "overview" | "profit";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: "Today", from: todayStr, to: todayStr },
  { label: "This Week", from: () => daysAgoStr(6), to: todayStr },
  { label: "This Month", from: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), to: todayStr },
  { label: "This Year", from: () => `${new Date().getFullYear()}-01-01`, to: todayStr },
  { label: "All Time", from: () => "", to: () => "" },
];

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [from, setFrom] = useState(daysAgoStr(29));
  const [to, setTo] = useState(todayStr());

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadProfit = useCallback(async (f: string, t: string) => {
    setProfitLoading(true);
    try {
      const params = new URLSearchParams();
      if (f) params.set("from", f);
      if (t) params.set("to", t);
      const res = await fetch(`/api/admin/profit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const j = (await res.json()) as ProfitData;
      setProfit(j);
    } catch {
      setProfit(null);
    } finally {
      setProfitLoading(false);
    }
  }, []);

  const applyPreset = (p: typeof PRESETS[number]) => {
    const f = p.from();
    const t = p.to();
    setFrom(f);
    setTo(t);
    loadProfit(f, t);
  };

  const applyCustom = () => {
    loadProfit(from, to);
  };

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

  const profitCards = profit ? [
    { label: "Gross Revenue", value: fmt(profit.summary.revenue), icon: IndianRupee, color: "text-green-600 bg-green-100" },
    { label: "Cost of Goods", value: fmt(profit.summary.cost), icon: PackageOpen, color: "text-orange-600 bg-orange-100" },
    { label: "Net Profit", value: fmt(profit.summary.profit), icon: TrendingUp, color: profit.summary.profit >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100" },
    { label: "Profit Margin", value: profit.summary.margin.toFixed(1) + "%", icon: Percent, color: "text-blue-600 bg-blue-100" },
    { label: "Delivery Fees", value: fmt(profit.summary.deliveryFees), icon: Truck, color: "text-cyan-600 bg-cyan-100" },
    { label: "Delivered Orders", value: profit.summary.orderCount, icon: CheckCircle2, color: "text-purple-600 bg-purple-100" },
  ] : [];

  return (
    <div>
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="text-sm text-muted">Business performance and profitability</p>

      {/* Tab bar */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setTab("overview")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${tab === "overview" ? "bg-brand-fresh text-white shadow-lg shadow-brand-fresh/25" : "border border-white/10 text-muted hover:border-white/20"}`}
        >
          Overview
        </button>
        <button
          onClick={() => { setTab("profit"); if (!profit) applyPreset(PRESETS[2]); }}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${tab === "profit" ? "bg-brand-fresh text-white shadow-lg shadow-brand-fresh/25" : "border border-white/10 text-muted hover:border-white/20"}`}
        >
          Profit
        </button>
      </div>

      {tab === "overview" && (
        <>
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
        </>
      )}

      {tab === "profit" && (
        <div className="mt-6">
          {/* Date range controls */}
          <div className="mb-6 rounded-xl border bg-surface p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${from === p.from() && to === p.to() ? "bg-brand-fresh text-white" : "border border-white/10 text-muted hover:border-white/20"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-muted">From</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-brand-fresh/40" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-muted">To</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-brand-fresh/40" />
                </div>
                <button onClick={applyCustom} className="rounded-lg bg-brand-fresh px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-fresh-dim">
                  Apply
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Profit uses delivery date and counts delivery fees as income. Cost is from each product's buying price (per weight).
            </p>
          </div>

          {profitLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-light" /></div>
          ) : !profit ? (
            <div className="py-10 text-center text-sm text-muted-light">No data for this range.</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profitCards.map((c) => (
                  <div key={c.label} className="rounded-xl border bg-surface p-5 shadow-sm">
                    <div className={"mb-3 inline-flex rounded-lg p-2.5 " + c.color}>
                      <c.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="mt-0.5 text-xs text-muted">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Revenue vs cost area chart */}
              <div className="mt-6 rounded-xl border bg-surface p-6 shadow-sm">
                <h3 className="font-bold">Revenue vs Cost</h3>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profit.daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D7D3A" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#2D7D3A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E2574C" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#E2574C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: string) => v.slice(5)} minTickGap={20} />
                      <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                      <Tooltip formatter={(v) => "₹" + Number(v).toLocaleString("en-IN")} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#2D7D3A" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                      <Area type="monotone" dataKey="cost" stroke="#E2574C" strokeWidth={2} fill="url(#costGrad)" name="Cost" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Most profitable products */}
                <div className="rounded-xl border bg-surface p-6 shadow-sm">
                  <h3 className="font-bold">Most Profitable Products</h3>
                  <div className="mt-4 space-y-3">
                    {profit.topProducts.length === 0 && <p className="text-sm text-muted">No delivered orders in this range.</p>}
                    {profit.topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 shrink-0 text-xs font-bold text-muted">{i + 1}.</span>
                          <div className="min-w-0">
                            <div className="truncate text-sm">{p.name}</div>
                            <div className="text-xs text-muted">{p.quantity} pcs · ₹{p.revenue.toLocaleString("en-IN")} rev</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-bold ${p.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {p.profit >= 0 ? "+" : ""}₹{p.profit.toLocaleString("en-IN")}
                          </span>
                          <div className="text-xs text-muted">
                            {p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(0) + "% margin" : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profit by payment method */}
                <div className="rounded-xl border bg-surface p-6 shadow-sm">
                  <h3 className="font-bold">Profit by Payment Method</h3>
                  <div className="mt-4 space-y-4">
                    {(["cod", "upi"] as const).map((m) => (
                      <div key={m} className="rounded-lg border border-border/50 bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Wallet className="h-4 w-4 text-muted" />
                            {m === "cod" ? "Cash on Delivery" : "UPI"}
                          </span>
                          <span className={`text-lg font-bold ${profit.paymentMix[m].profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {profit.paymentMix[m].profit >= 0 ? "+" : ""}₹{profit.paymentMix[m].profit.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted">Revenue: ₹{profit.paymentMix[m].revenue.toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg border border-brand-fresh/20 bg-brand-fresh/5 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-brand-fresh">
                      <Target className="h-4 w-4" /> Profit Formula
                    </h4>
                    <p className="mt-2 text-xs text-muted">
                      Net Profit = (Selling price − Buying price) × qty + Delivery fee, summed across delivered orders.
                      Previously delivered orders before buying prices were added show 0 cost until you set buying prices.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

