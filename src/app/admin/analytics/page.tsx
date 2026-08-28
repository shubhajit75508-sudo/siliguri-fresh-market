"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, ShoppingBag, IndianRupee, Clock, Truck, TrendingUp, Users, Wallet,
  CheckCircle2, Target, Percent, PackageOpen, ArrowUp, ArrowDown, RotateCcw, Repeat, UserPlus, MapPin, Layers, Crown
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell
} from "recharts";

interface WeightPrice { weight: string; price: number }

interface GrowthData {
  summary: { revenue: number; cost: number; profit: number; deliveryFees: number; orderCount: number };
  margin: number;
  daily: { date: string; revenue: number; cost: number; profit: number; orderCount: number }[];
  categories: { category: string; orders: number; revenue: number; cost: number; profit: number; qty: number; margin: number }[];
  topProducts: { name: string; quantity: number; revenue: number; cost: number; profit: number }[];
  zones: {
    buckets: { label: string; orders: number; revenue: number; aov: number }[];
    uncategorized: number;
    areas: { area: string; orders: number; revenue: number }[];
  };
  customers: {
    totalCustomers: number; repeatCustomers: number; newCustomers: number;
    repeatRate: number; avgOrdersPerCustomer: number;
    topSpenders: { name: string; email: string; phone: string; orders: number; spend: number; aov: number; lastAt: string }[];
  };
  customerTrend: { date: string; newCustomers: number; repeatOrders: number; total: number }[];
  growth: { prevRevenue: number; revenueChangePct: number; revenueChangeAmount: number };
  orders: { total: number; delivered: number; cancelled: number; aov: number; deliverySuccessRate: number; avgOrderValueAll: number };
  paymentMix: { cod: { count: number; revenue: number; profit: number }; upi: { count: number; revenue: number; profit: number } };
  dateRange: { from: string | null; to: string | null; days: number };
}

type Tab = "overview" | "profit" | "customers" | "categories" | "zones";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysAgoStr(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: "Today", from: todayStr, to: todayStr },
  { label: "Last 7 Days", from: () => daysAgoStr(6), to: todayStr },
  { label: "This Week", from: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); }, to: todayStr },
  { label: "This Month", from: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), to: todayStr },
  { label: "Last 30 Days", from: () => daysAgoStr(29), to: todayStr },
  { label: "This Year", from: () => `${new Date().getFullYear()}-01-01`, to: todayStr },
  { label: "All Time", from: () => "", to: () => "" },
];

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n);

const CATEGORY_LABELS: Record<string, string> = {
  fish: "Fish", chicken: "Chicken", mutton: "Mutton", pork: "Pork", seafood: "Seafood",
  vegetables: "Vegetables", fruits: "Fruits", eggs: "Eggs", dairy: "Dairy", grocery: "Grocery", essentials: "Essentials", other: "Other",
};

const PIE_COLORS = ["#2D7D3A", "#2563eb", "#E2574C", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899", "#10B981", "#F97316", "#64748B", "#a855f7", "#84cc16"];

function KpiCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border bg-surface p-5 shadow-sm">
      <div className={"mb-3 inline-flex rounded-lg p-2.5 " + color}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-muted/80">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(daysAgoStr(29));
  const [to, setTo] = useState(todayStr());

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f) params.set("from", f);
      if (t) params.set("to", t);
      const res = await fetch(`/api/admin/growth?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setData((await res.json()) as GrowthData);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (p: typeof PRESETS[number]) => {
    const f = p.from();
    const t = p.to();
    setFrom(f);
    setTo(t);
    load(f, t);
  };

  const applyCustom = () => load(from, to);

  const fmtDate = (ds: string | null) => ds ? ds : "—";

  /* ---------- Derived panel components ---------- */
  const SalesTrendPanel = () => (
    <div className="rounded-xl border bg-surface p-6 shadow-sm">
      <h3 className="font-bold">Sales Trend (Revenue vs Profit)</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data!.daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2D7D3A" stopOpacity={0.6} /><stop offset="95%" stopColor="#2D7D3A" stopOpacity={0} /></linearGradient>
              <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: string) => v.slice(5)} minTickGap={20} />
            <YAxis tick={{ fontSize: 10, fill: "#888" }} />
            <Tooltip formatter={(v) => "₹" + Number(v).toLocaleString("en-IN")} />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="#2D7D3A" strokeWidth={2} fill="url(#rev)" name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={2} fill="url(#prof)" name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const GrowthBadge = () => {
    const g = data!.growth;
    const up = g.revenueChangePct >= 0;
    return (
      <div className="rounded-xl border bg-surface p-6 shadow-sm">
        <h3 className="font-bold">Sales Growth</h3>
        <p className="mt-1 text-xs text-muted">vs previous equal period (delivered revenue)</p>
        <div className="mt-4 flex items-center gap-3">
          <div className={"inline-flex rounded-xl p-3 " + (up ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
            {up ? <ArrowUp className="h-6 w-6" /> : <ArrowDown className="h-6 w-6" />}
          </div>
          <div>
            <p className={"text-2xl font-bold " + (up ? "text-emerald-600" : "text-red-600")}>
              {g.revenueChangePct.toFixed(1)}%
            </p>
            <p className="text-xs text-muted">{fmtSigned(g.revenueChangeAmount)} vs previous</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">Previous period revenue: {fmt(g.prevRevenue)}</p>
      </div>
    );
  };

  /* ================= OVERVIEW ================= */
  const renderOverview = () => {
    const s = data!.summary;
    const o = data!.orders;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Revenue" value={fmt(s.revenue)} icon={IndianRupee} color="text-green-600 bg-green-100" sub={`${o.delivered} delivered orders`} />
          <KpiCard label="Net Profit" value={fmt(s.profit)} icon={TrendingUp} color={s.profit >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100"} sub={`${data!.margin.toFixed(1)}% margin`} />
          <KpiCard label="Avg Order Value" value={fmt(o.aov)} icon={ShoppingBag} color="text-blue-600 bg-blue-100" sub={`${fmt(o.avgOrderValueAll)} overall`} />
          <KpiCard label="Customers" value={data!.customers.totalCustomers} icon={Users} color="text-pink-600 bg-pink-100" sub={`${data!.customers.repeatRate.toFixed(0)}% repeating`} />
          <KpiCard label="New Customers" value={data!.customers.newCustomers} icon={UserPlus} color="text-purple-600 bg-purple-100" />
          <KpiCard label="Repeat Customers" value={data!.customers.repeatCustomers} icon={Repeat} color="text-cyan-600 bg-cyan-100" sub={`avg ${data!.customers.avgOrdersPerCustomer.toFixed(1)} orders/cust`} />
          <KpiCard label="Cancelled" value={o.cancelled} icon={RotateCcw} color="text-orange-600 bg-orange-100" />
          <KpiCard label="Delivery Success" value={o.deliverySuccessRate + "%"} icon={CheckCircle2} color="text-lime-600 bg-lime-100" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><SalesTrendPanel /></div>
          <GrowthBadge />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-surface p-6 shadow-sm">
            <h3 className="font-bold">New vs Returning Customers</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data!.customerTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: string) => v.slice(5)} minTickGap={20} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newCustomers" fill="#2D7D3A" stackId="a" name="New" />
                  <Bar dataKey="repeatOrders" fill="#2563eb" stackId="a" name="Returning" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-surface p-6 shadow-sm">
            <h3 className="font-bold">Top Categories by Revenue</h3>
            <div className="mt-4 space-y-3">
              {data!.categories.length === 0 && <p className="text-sm text-muted">No delivered orders yet.</p>}
              {data!.categories.slice(0, 6).map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <span className="text-sm">{CATEGORY_LABELS[c.category] || c.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{fmt(c.revenue)}</span>
                    <span className={"text-xs font-bold " + (c.profit >= 0 ? "text-emerald-500" : "text-red-500")}>{c.profit >= 0 ? "+" : ""}{fmt(c.profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Most Profitable Products</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Profit</th>
                  <th className="px-3 py-2 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data!.topProducts.slice(0, 10).map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-right">{p.quantity}</td>
                    <td className="px-3 py-2 text-right">{fmt(p.revenue)}</td>
                    <td className="px-3 py-2 text-right">{fmt(p.cost)}</td>
                    <td className={"px-3 py-2 text-right font-semibold " + (p.profit >= 0 ? "text-emerald-500" : "text-red-500")}>{p.profit >= 0 ? "+" : ""}{fmt(p.profit)}</td>
                    <td className="px-3 py-2 text-right text-muted">{p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data!.topProducts.length === 0 && <p className="mt-3 text-sm text-muted">No delivered orders in this range.</p>}
          </div>
        </div>
      </div>
    );
  };

  /* ================= PROFIT ================= */
  const renderProfit = () => {
    const s = data!.summary;
    const pm = data!.paymentMix;
    const profitCards = [
      { label: "Gross Revenue", value: fmt(s.revenue), icon: IndianRupee, color: "text-green-600 bg-green-100" },
      { label: "Cost of Goods", value: fmt(s.cost), icon: PackageOpen, color: "text-orange-600 bg-orange-100" },
      { label: "Net Profit", value: fmt(s.profit), icon: TrendingUp, color: s.profit >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100" },
      { label: "Profit Margin", value: data!.margin.toFixed(1) + "%", icon: Percent, color: "text-blue-600 bg-blue-100" },
      { label: "Delivery Fees", value: fmt(s.deliveryFees), icon: Truck, color: "text-cyan-600 bg-cyan-100" },
      { label: "Delivered Orders", value: s.orderCount, icon: CheckCircle2, color: "text-purple-600 bg-purple-100" },
    ];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profitCards.map((c) => (
            <KpiCard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>

        <SalesTrendPanel />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-surface p-6 shadow-sm">
            <h3 className="font-bold">Profit by Category</h3>
            <div className="mt-4 space-y-3">
              {data!.categories.map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <span className="text-sm">{CATEGORY_LABELS[c.category] || c.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{fmt(c.revenue)}</span>
                    <span className={"text-sm font-bold " + (c.profit >= 0 ? "text-emerald-500" : "text-red-500")}>{c.profit >= 0 ? "+" : ""}{fmt(c.profit)}</span>
                    <span className="w-12 text-right text-xs text-muted">{c.margin.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
              {data!.categories.length === 0 && <p className="text-sm text-muted">No delivered orders yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-surface p-6 shadow-sm">
            <h3 className="font-bold">Profit by Payment Method</h3>
            <div className="mt-4 space-y-4">
              {(["cod", "upi"] as const).map((m) => (
                <div key={m} className="rounded-lg border border-border/50 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Wallet className="h-4 w-4 text-muted" />
                      {m === "cod" ? "Cash on Delivery" : "UPI"}
                    </span>
                    <span className={"text-lg font-bold " + (pm[m].profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {pm[m].profit >= 0 ? "+" : ""}{fmt(pm[m].profit)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">{pm[m].count} orders · Revenue {fmt(pm[m].revenue)}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-brand-fresh/20 bg-brand-fresh/5 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-brand-fresh"><Target className="h-4 w-4" /> Profit Formula</h4>
              <p className="mt-2 text-xs text-muted">Net Profit = (Selling − Buying per weight) × qty + Delivery fee, for delivered orders only. Set buying prices on products for accurate numbers.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================= CUSTOMERS ================= */
  const renderCustomers = () => {
    const c = data!.customers;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Customers" value={c.totalCustomers} icon={Users} color="text-pink-600 bg-pink-100" />
          <KpiCard label="New Customers" value={c.newCustomers} icon={UserPlus} color="text-purple-600 bg-purple-100" />
          <KpiCard label="Repeat Customers" value={c.repeatCustomers} icon={Repeat} color="text-cyan-600 bg-cyan-100" />
          <KpiCard label="Repeat Purchase Rate" value={c.repeatRate.toFixed(1) + "%"} icon={Crown} color="text-amber-600 bg-amber-100" sub={`avg ${c.avgOrdersPerCustomer.toFixed(1)} orders/customer`} />
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">New vs Returning Customers Over Time</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data!.customerTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v: string) => v.slice(5)} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCustomers" fill="#2D7D3A" stackId="a" name="New" />
                <Bar dataKey="repeatOrders" fill="#2563eb" stackId="a" name="Returning" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold"><Crown className="h-4 w-4 text-amber-500" /> Top Spenders (Customer Value)</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2 text-right">Total Spend</th>
                  <th className="px-3 py-2 text-right">AOV</th>
                  <th className="px-3 py-2 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {c.topSpenders.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted">{s.phone ? `+${s.phone}` : s.email || "guest"}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{s.orders}</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(s.spend)}</td>
                    <td className="px-3 py-2 text-right">{fmt(s.aov)}</td>
                    <td className="px-3 py-2 text-right text-xs text-muted">{fmtDate(s.lastAt?.slice(0, 10))}</td>
                  </tr>
                ))}
                {c.topSpenders.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-muted">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ================= CATEGORIES & PRODUCTS ================= */
  const renderCategories = () => {
    const catData = data!.categories.slice(0, 8).map((c) => ({ name: CATEGORY_LABELS[c.category] || c.category, value: Math.max(0, Math.round(c.revenue)) }));
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-surface p-6 shadow-sm">
            <h3 className="font-bold">Revenue by Category</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e: any) => e.name}>
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => "₹" + Number(v).toLocaleString("en-IN")} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-surface p-6 shadow-sm">
            <h3 className="font-bold">Category Performance</h3>
            <div className="mt-4 space-y-3">
              {data!.categories.map((c) => (
                <div key={c.category} className="flex items-center justify-between border-b border-border/40 last:border-0 pb-2">
                  <div>
                    <span className="text-sm font-semibold">{CATEGORY_LABELS[c.category] || c.category}</span>
                    <div className="text-xs text-muted">{c.orders} orders · {c.qty} units</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmt(c.revenue)}</div>
                    <div className={"text-xs font-bold " + (c.profit >= 0 ? "text-emerald-500" : "text-red-500")}>{c.profit >= 0 ? "+" : ""}{fmt(c.profit)} · {c.margin.toFixed(0)}% mgn</div>
                  </div>
                </div>
              ))}
              {data!.categories.length === 0 && <p className="text-sm text-muted">No delivered orders yet.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Top Products by Profit</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Profit</th>
                  <th className="px-3 py-2 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {data!.topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-right">{p.quantity}</td>
                    <td className="px-3 py-2 text-right">{fmt(p.revenue)}</td>
                    <td className="px-3 py-2 text-right">{fmt(p.cost)}</td>
                    <td className={"px-3 py-2 text-right font-semibold " + (p.profit >= 0 ? "text-emerald-500" : "text-red-500")}>{p.profit >= 0 ? "+" : ""}{fmt(p.profit)}</td>
                    <td className="px-3 py-2 text-right text-muted">{p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0"}</td>
                  </tr>
                ))}
                {data!.topProducts.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-muted">No delivered orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ================= ZONES ================= */
  const renderZones = () => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.zones.buckets.map((z) => (
            <div key={z.label} className="rounded-xl border bg-surface p-5 shadow-sm">
              <div className="mb-3 inline-flex rounded-lg bg-blue-100 p-2.5 text-blue-600"><MapPin className="h-5 w-5" /></div>
              <p className="text-lg font-bold">{z.orders} orders</p>
              <p className="text-sm font-semibold">{fmt(z.revenue)}</p>
              <p className="mt-0.5 text-xs text-muted">{z.label} · AOV {fmt(z.aov)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Deliveries by Distance Zone</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data!.zones.buckets} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip formatter={(v) => [v, "Orders"]} />
                <Bar dataKey="orders" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold"><Layers className="h-4 w-4 text-muted" /> Top Delivery Areas</h3>
          <div className="mt-4 space-y-2">
            {data!.zones.areas.map((a, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                <span className="text-sm">{a.area}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted">{a.orders} orders</span>
                  <span className="font-semibold">{fmt(a.revenue)}</span>
                </div>
              </div>
            ))}
            {data!.zones.areas.length === 0 && <p className="text-sm text-muted">No delivered orders yet.</p>}
          </div>
          <p className="mt-3 text-xs text-muted">{data!.zones.uncategorized} orders without a GPS distance recorded.</p>
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-light" /></div>;
  }
  if (!data) {
    return <div className="py-10 text-center text-sm text-muted-light">Failed to load analytics. <button onClick={() => applyCustom()} className="text-brand-fresh underline">Retry</button></div>;
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "profit", label: "Profit", icon: IndianRupee },
    { id: "customers", label: "Customers", icon: Users },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "zones", label: "Zones", icon: MapPin },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted">Profitability & growth overview · {fmtDate(from)} → {fmtDate(to)}</p>
        </div>
      </div>

      {/* Date range controls */}
      <div className="mt-4 rounded-xl border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active = from === p.from() && to === p.to();
              return (
                <button key={p.label} onClick={() => applyPreset(p)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${active ? "bg-brand-fresh text-white" : "border border-white/10 text-muted hover:border-white/20"}`}>
                  {p.label}
                </button>
              );
            })}
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
            <button onClick={applyCustom} className="rounded-lg bg-brand-fresh px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-fresh-dim">Apply</button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${tab === t.id ? "bg-brand-fresh text-white shadow-lg shadow-brand-fresh/25" : "border border-white/10 text-muted hover:border-white/20"}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-light" /></div>
        ) : tab === "overview" ? renderOverview()
          : tab === "profit" ? renderProfit()
          : tab === "customers" ? renderCustomers()
          : tab === "categories" ? renderCategories()
          : renderZones()}
      </div>
    </div>
  );
}
