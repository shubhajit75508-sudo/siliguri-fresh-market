"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, CalendarDays, CheckCircle2, Clock, Download, IndianRupee,
  Layers, Loader2, MapPin, PackageOpen, Percent, RefreshCw, Repeat, RotateCcw, ShoppingBag,
  Target, TrendingUp, Truck, UserPlus, Users, Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { DataTable, type Column } from "@/components/admin/analytics/data-table";
import { DemandHeatmap } from "@/components/admin/analytics/demand-heatmap";

/* ─────────────────────────── response types ─────────────────────────── */

type Summary = {
  revenue: number; merchRevenue: number; cost: number; profit: number; netProfit: number;
  deliveryFees: number; discounts: number; extraCharges: number; partnerPayouts: number;
  margin: number; aov: number; itemsSold: number; avgItemsPerOrder: number; avgOrderValue: number;
  orderCount: number;
};
type DailyRow = {
  date: string; revenue: number; merchRevenue: number; cost: number; profit: number;
  deliveryFees: number; discounts: number; orderCount: number; itemsSold: number;
};
type GrowthData = {
  generatedAt: string;
  timezone: string;
  range: { from: string; to: string; days: number; defaulted: boolean; seriesTruncated: boolean };
  summary: Summary;
  reconciliation: { storedTotal: number; computedRevenue: number; delta: number };
  dataQuality: {
    missingCostItems: number; estimatedCostItems: number;
    ordersWithoutCost: number; lifetimeSampleTruncated: boolean;
  };
  growth: {
    from: string; to: string; revenue: number; profit: number; orderCount: number; aov: number;
    revenueChangeAmount: number; revenueChangePct: number | null;
    profitChangeAmount: number; profitChangePct: number | null;
    orderChangePct: number | null;
  };
  daily: DailyRow[];
  rolling7: number[];
  categories: { category: string; orders: number; qty: number; revenue: number; cost: number; profit: number; margin: number }[];
  topProducts: { id: string; name: string; category: string; quantity: number; revenue: number; cost: number; profit: number; margin: number }[];
  weightMix: { weight: string; qty: number; revenue: number; orders: number }[];
  paymentMix: { cod: { count: number; revenue: number; profit: number; orders: number }; upi: { count: number; revenue: number; profit: number; orders: number } };
  zones: {
    buckets: { label: string; orders: number; revenue: number; aov: number }[];
    outOfRange: number; missingDistance: number;
    areas: { area: string; orders: number; revenue: number }[];
  };
  dow: { label: string; short: string; orders: number; revenue: number; aov: number }[];
  hour: { hour: number; orders: number; revenue: number; aov: number }[];
  heatmap: { dayLabels: string[]; hours: number[]; orders: number[][]; revenue: number[][] };
  peak: { hour: { hour: number; orders: number; revenue: number; aov: number }; day: { label: string; orders: number; revenue: number; aov: number } };
  customers: {
    totalCustomers: number; newCustomers: number; returningCustomers: number; repeatRate: number;
    lifetimeCustomers: number; avgOrdersPerCustomer: number;
    topSpenders: { name: string; email: string; phone: string; orders: number; spend: number; aov: number; lastAt: string; repeat: boolean }[];
  };
  customerTrend: { date: string; newCustomers: number; repeatOrders: number; total: number }[];
  cohorts: { month: string; customers: number; returned: number; retentionPct: number; revenue: number }[];
  orders: {
    total: number; delivered: number; cancelled: number; pending: number; outForDelivery: number;
    statusBreakdown: { status: string; count: number }[];
    deliverySuccessRate: number; avgItemsPerOrder: number;
  };
  margin: number;
  netMargin: number;
};

/* ─────────────────────────── helpers ─────────────────────────── */

const fmt = (n: number) => "₹" + Math.round(n ?? 0).toLocaleString("en-IN");
const fmtSigned = (n: number) => (n >= 0 ? "+" : "") + fmt(n);
const pctLabel = (n: number | null) => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`);

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function startOfMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: "Today", from: todayStr, to: todayStr },
  { label: "Last 7 Days", from: () => daysAgoStr(6), to: todayStr },
  { label: "Last 30 Days", from: () => daysAgoStr(29), to: todayStr },
  { label: "Last 90 Days", from: () => daysAgoStr(89), to: todayStr },
  { label: "This Month", from: startOfMonthStr, to: todayStr },
  { label: "This Year", from: () => `${new Date().getFullYear()}-01-01`, to: todayStr },
];

const CATEGORY_LABELS: Record<string, string> = {
  fish: "Fish", chicken: "Chicken", mutton: "Mutton", pork: "Pork", seafood: "Seafood",
  vegetables: "Vegetables", fruits: "Fruits", eggs: "Eggs", dairy: "Dairy",
  grocery: "Grocery", essentials: "Essentials", other: "Other",
};
const catLabel = (c: string) => CATEGORY_LABELS[c] ?? c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const PIE_COLORS = ["#2D7D3A", "#2563eb", "#E2574C", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899", "#10B981", "#F97316", "#64748B", "#a855f7", "#84cc16"];
const GRID = "#E0E6E1";
const AXIS = { fontSize: 10, fill: "#6B7B6B" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profit", label: "Profit" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "demand", label: "Demand" },
  { id: "zones", label: "Zones" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const isTab = (v: string | null): v is Tab => !!v && TABS.some((t) => t.id === v);

/* ─────────────────────────── small components ─────────────────────────── */

function Card({ title, hint, children, action }: { title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Delta({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs text-muted">no prior data</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${up ? "text-emerald-600" : "text-red-600"}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {pctLabel(value)}
      {suffix}
    </span>
  );
}

function KpiCard({
  label, value, icon, color, sub, delta,
}: {
  label: string; value: string | number; icon: LucideIcon; color: string; sub?: string; delta?: number | null;
}) {
  const Icon = icon;
  return (
    <div className="rounded-xl border bg-surface p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {delta !== undefined && <Delta value={delta} />}
        {sub && <span className="text-[11px] text-muted/80">{sub}</span>}
      </div>
    </div>
  );
}

function MiniBar({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "red" | "blue" }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const bg = tone === "red" ? "bg-red-400" : tone === "blue" ? "bg-blue-500" : "bg-brand-fresh";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${w}%` }} />
    </div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

function readUrlParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export default function AnalyticsPage() {
  // Seed from the URL in the initialisers so the view is shareable and survives a
  // refresh without an effect that would cause a cascading re-render.
  const [tab, setTab] = useState<Tab>(() => {
    const tb = readUrlParam("tab");
    return isTab(tb) ? tb : "overview";
  });
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(() => readUrlParam("from") ?? daysAgoStr(29));
  const [to, setTo] = useState(() => readUrlParam("to") ?? todayStr());
  const abortRef = useRef<AbortController | null>(null);

  const syncUrl = useCallback((f: string, t: string, nextTab: Tab) => {
    const p = new URLSearchParams(window.location.search);
    p.set("from", f);
    p.set("to", t);
    p.set("tab", nextTab);
    window.history.replaceState(null, "", `?${p.toString()}`);
  }, []);

  const load = useCallback(
    async (f: string, t: string, mode: "initial" | "refresh") => {
      // Abort any in-flight request so a slow earlier response cannot
      // overwrite a newer selection.
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (f) params.set("from", f);
        if (t) params.set("to", t);
        const res = await fetch(`/api/admin/growth?${params.toString()}`, { signal: ac.signal });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        setData((await res.json()) as GrowthData);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // Keep whatever is already on screen; a failed refresh should not wipe it.
        setError((e as Error).message);
        setData((prev) => prev);
      } finally {
        if (abortRef.current === ac) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => { void load(from, to, "initial"); }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    const f = p.from();
    const t = p.to();
    setFrom(f);
    setTo(t);
    syncUrl(f, t, tab);
    void load(f, t, "refresh");
  };

  const applyCustom = () => {
    syncUrl(from, to, tab);
    void load(from, to, "refresh");
  };

  const onTab = (next: Tab) => {
    setTab(next);
    syncUrl(from, to, next);
  };

  const s = data?.summary;
  const g = data?.growth;

  /* ---------- CSV export of the whole report ---------- */
  const exportReport = () => {
    if (!data) return;
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines: string[] = [];
    lines.push(`Siliguri Freshmart — Analytics Report`);
    lines.push(`Range,${data.range.from} to ${data.range.to} (${data.range.days} days, ${data.timezone})`);
    lines.push(`Generated,${data.generatedAt}`);
    lines.push("");
    lines.push(["Metric", "Value"].map(q).join(","));
    const pairs: [string, number][] = [
      ["Revenue (incl. delivery fees)", s!.revenue],
      ["Product revenue (net of discounts)", s!.merchRevenue],
      ["Cost of goods", s!.cost],
      ["Net profit", s!.profit],
      ["Profit margin %", s!.margin],
      ["Delivery fees (shop profit)", s!.deliveryFees],
      ["Discounts given", s!.discounts],
      ["Delivered orders", s!.orderCount],
      ["Items sold", s!.itemsSold],
      ["Avg order value", s!.aov],
      ["Previous period revenue", g!.revenue],
      ["Revenue change %", g!.revenueChangePct ?? 0],
      ["Profit change %", g!.profitChangePct ?? 0],
    ];
    for (const [k, v] of pairs) lines.push(`${q(k)},${v}`);

    lines.push("");
    lines.push(["Date", "Revenue", "Product revenue", "Cost", "Profit", "Delivery fees", "Discounts", "Orders", "Items"].map(q).join(","));
    for (const d of data.daily) {
      lines.push([d.date, d.revenue, d.merchRevenue, d.cost, d.profit, d.deliveryFees, d.discounts, d.orderCount, d.itemsSold].join(","));
    }

    lines.push("");
    lines.push(["Product", "Category", "Qty", "Revenue", "Cost", "Profit", "Margin %"].map(q).join(","));
    for (const p of data.topProducts) {
      lines.push([q(p.name), q(p.category), p.quantity, p.revenue, p.cost, p.profit, p.margin].join(","));
    }

    lines.push("");
    lines.push(["Category", "Orders", "Qty", "Revenue", "Cost", "Profit", "Margin %"].map(q).join(","));
    for (const c of data.categories) {
      lines.push([q(c.category), c.orders, c.qty, c.revenue, c.cost, c.profit, c.margin].join(","));
    }

    lines.push("");
    lines.push(["Customer", "Email", "Phone", "Orders", "Spend", "AOV", "Last order", "Repeat"].map(q).join(","));
    for (const c of data.customers.topSpenders) {
      lines.push([q(c.name), q(c.email), q(c.phone), c.orders, c.spend, c.aov, q(c.lastAt), c.repeat ? "yes" : "no"].join(","));
    }

    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${data.range.from}_to_${data.range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- table column definitions ---------- */
  const productCols: Column<GrowthData["topProducts"][number]>[] = useMemo(
    () => [
      { key: "name", header: "Product", sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "category", header: "Category", sortValue: (r) => r.category, render: (r) => <span className="text-muted">{catLabel(r.category)}</span> },
      { key: "qty", header: "Qty", align: "right", sortValue: (r) => r.quantity, render: (r) => r.quantity },
      { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.revenue, render: (r) => fmt(r.revenue) },
      { key: "cost", header: "Cost", align: "right", sortValue: (r) => r.cost, render: (r) => <span className="text-orange-600">{fmt(r.cost)}</span> },
      {
        key: "profit", header: "Profit", align: "right", sortValue: (r) => r.profit,
        render: (r) => <span className={r.profit >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{fmt(r.profit)}</span>,
      },
      { key: "margin", header: "Margin", align: "right", sortValue: (r) => r.margin, render: (r) => `${r.margin.toFixed(1)}%` },
    ],
    []
  );

  const customerCols: Column<GrowthData["customers"]["topSpenders"][number]>[] = useMemo(
    () => [
      {
        key: "name", header: "Customer", sortValue: (r) => r.name,
        render: (r) => (
          <div>
            <p className="font-medium">{r.name}</p>
            {(r.email || r.phone) && <p className="text-[11px] text-muted">{r.email || r.phone}</p>}
          </div>
        ),
      },
      { key: "orders", header: "Orders", align: "right", sortValue: (r) => r.orders, render: (r) => r.orders },
      { key: "spend", header: "Spend", align: "right", sortValue: (r) => r.spend, render: (r) => <span className="font-semibold">{fmt(r.spend)}</span> },
      { key: "aov", header: "AOV", align: "right", sortValue: (r) => r.aov, render: (r) => fmt(r.aov) },
      {
        key: "lastAt", header: "Last order", align: "right", sortValue: (r) => r.lastAt,
        render: (r) => <span className="text-muted">{r.lastAt ? r.lastAt.slice(0, 10) : "—"}</span>,
      },
      {
        key: "repeat", header: "Type", align: "center", sortValue: (r) => (r.repeat ? 1 : 0),
        render: (r) => (r.repeat ? <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Repeat</span> : <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">New</span>),
      },
    ],
    []
  );

  const areaCols: Column<GrowthData["zones"]["areas"][number]>[] = useMemo(
    () => [
      { key: "area", header: "Area", sortValue: (r) => r.area, render: (r) => r.area },
      { key: "orders", header: "Orders", align: "right", sortValue: (r) => r.orders, render: (r) => r.orders },
      { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.revenue, render: (r) => fmt(r.revenue) },
    ],
    []
  );

  const trendChart = useMemo(() => {
    if (!data) return [];
    return data.daily.map((d, i) => ({ ...d, avg7: data.rolling7[i] }));
  }, [data]);

  /* ---------- render ---------- */
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!data || !s) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted">{error ?? "Failed to load analytics."}</p>
        <button onClick={applyCustom} className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-brand-fresh/5">
          Retry
        </button>
      </div>
    );
  }

  const maxCategoryRevenue = Math.max(...data.categories.map((c) => c.revenue), 1);

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {data.range.from} → {data.range.to} ({data.range.days} {data.range.days === 1 ? "day" : "days"})
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated {new Date(data.generatedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </span>
            {refreshing && <span className="inline-flex items-center gap-1 text-brand-fresh"><Loader2 className="h-3 w-3 animate-spin" /> refreshing…</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-sm font-medium hover:bg-brand-fresh/5"
          >
            <Download className="h-4 w-4" /> Export report
          </button>
          <button
            onClick={applyCustom}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-sm font-medium hover:bg-brand-fresh/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not refresh: {error}. Showing the last successful load.</span>
        </div>
      )}

      {/* ── filters ── */}
      <div className="rounded-xl border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = from === p.from() && to === p.to();
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active ? "border-brand-fresh bg-brand-fresh text-white" : "hover:bg-brand-fresh/5"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            From
            <input
              type="date" value={from} max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand-fresh"
            />
          </label>
          <label className="text-xs text-muted">
            To
            <input
              type="date" value={to} min={from} max={todayStr()}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-brand-fresh"
            />
          </label>
          <button onClick={applyCustom} className="rounded-lg bg-brand-fresh px-4 py-2 text-sm font-medium text-white">
            Apply
          </button>
          {from > to && <span className="pb-2 text-xs text-red-600">From date is after To date</span>}
        </div>
      </div>

      {/* ── data-quality banner ── */}
      {data.dataQuality.missingCostItems > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="shrink-0 rounded-lg bg-amber-500 p-2 text-white"><PackageOpen className="h-4 w-4" /></div>
          <div className="text-sm">
            <p className="font-bold text-amber-700">Profit is overstated for some items</p>
            <p className="mt-0.5 text-amber-700/90">
              <b>{data.dataQuality.missingCostItems}</b> sold line item(s) have no cost price set, so they count as ₹0 cost.
              A further <b>{data.dataQuality.estimatedCostItems}</b> use today&apos;s cost price because the order predates cost
              snapshots. Set the <b>Cost price</b> per weight in <b>Admin → Products</b> to tighten these numbers.
            </p>
          </div>
        </div>
      )}

      {/* ── tabs ── */}
      <div role="tablist" aria-label="Analytics sections" className="flex flex-wrap gap-1 rounded-xl border bg-surface p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-brand-fresh text-white" : "text-muted hover:bg-brand-fresh/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Revenue" value={fmt(s.revenue)} icon={IndianRupee} color="text-green-600 bg-green-100" delta={g!.revenueChangePct} sub={`${g!.from} → ${g!.to}`} />
            <KpiCard label="Net profit" value={fmt(s.profit)} icon={TrendingUp} color={s.profit >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100"} delta={g!.profitChangePct} sub={`${s.margin.toFixed(1)}% margin`} />
            <KpiCard label="Avg order value" value={fmt(s.aov)} icon={ShoppingBag} color="text-blue-600 bg-blue-100" delta={g!.orderChangePct} sub={`${s.avgItemsPerOrder.toFixed(1)} items/order`} />
            <KpiCard label="Delivered orders" value={s.orderCount} icon={CheckCircle2} color="text-purple-600 bg-purple-100" sub={`${data.orders.cancelled} cancelled`} />
          </div>

          <Card title="Revenue & profit trend" hint={`Delivery fees are included in revenue · ${data.timezone}`}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D7D3A" stopOpacity={0.5} /><stop offset="95%" stopColor="#2D7D3A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" tick={AXIS} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} />
                  <YAxis tick={AXIS} tickFormatter={(v: number) => "₹" + (v >= 1000 ? Math.round(v / 1000) + "k" : v)} />
                  <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={(l) => String(l)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#2D7D3A" strokeWidth={2} fill="url(#gRev)" name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={2} fill="url(#gProf)" name="Profit" />
                  <Line type="monotone" dataKey="avg7" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 3" dot={false} name="7-day avg revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Order funnel" hint="Based on orders created in this range">
              <div className="space-y-3">
                {[
                  { label: "Delivered", value: data.orders.delivered, tone: "text-emerald-600", icon: CheckCircle2 },
                  { label: "Cancelled", value: data.orders.cancelled, tone: "text-red-600", icon: RotateCcw },
                  { label: "Pending", value: data.orders.pending, tone: "text-amber-600", icon: Clock },
                  { label: "Out for delivery", value: data.orders.outForDelivery, tone: "text-blue-600", icon: Truck },
                ].map((r) => {
                  const max = Math.max(data.orders.total, 1);
                  return (
                    <div key={r.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-1.5 text-muted"><r.icon className="h-3.5 w-3.5" />{r.label}</span>
                        <span className={`font-semibold ${r.tone}`}>{r.value}</span>
                      </div>
                      <MiniBar value={r.value} max={max} tone={r.label === "Cancelled" ? "red" : "brand"} />
                    </div>
                  );
                })}
                <p className="pt-1 text-xs text-muted">
                  Delivery success rate <b className="text-foreground">{data.orders.deliverySuccessRate.toFixed(1)}%</b> of all closed orders.
                </p>
              </div>
            </Card>

            <Card title="Payment method" hint="Revenue and profit by how the customer paid">
              <div className="grid grid-cols-2 gap-4">
                {(["cod", "upi"] as const).map((m) => {
                  const p = data.paymentMix[m];
                  return (
                    <div key={m} className="rounded-lg border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{m === "cod" ? "Cash on delivery" : "UPI"}</p>
                      <p className="mt-1.5 text-xl font-bold tabular-nums">{fmt(p.revenue)}</p>
                      <p className="text-xs text-muted">{p.count} orders · {fmt(p.profit)} profit</p>
                      <div className="mt-2">
                        <MiniBar value={p.revenue} max={Math.max(data.paymentMix.cod.revenue, data.paymentMix.upi.revenue, 1)} tone={m === "upi" ? "blue" : "brand"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card title="Top categories" hint="Product revenue, net of discounts (excludes delivery fees)">
            <div className="space-y-3">
              {data.categories.slice(0, 8).map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{catLabel(c.category)}</span>
                    <span className="text-muted">
                      <span className="font-semibold text-foreground">{fmt(c.revenue)}</span> · {c.margin.toFixed(0)}% margin · {c.orders} orders
                    </span>
                  </div>
                  <MiniBar value={c.revenue} max={maxCategoryRevenue} />
                </div>
              ))}
              {data.categories.length === 0 && <p className="py-6 text-center text-sm text-muted">No delivered sales in this period.</p>}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════ PROFIT ══════════════ */}
      {tab === "profit" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Total revenue" value={fmt(s.revenue)} icon={IndianRupee} color="text-green-600 bg-green-100" sub="Product + delivery + extra" delta={g!.revenueChangePct} />
            <KpiCard label="Cost of goods" value={fmt(s.cost)} icon={PackageOpen} color="text-orange-600 bg-orange-100" sub={`${((s.cost / (s.revenue || 1)) * 100).toFixed(0)}% of revenue`} />
            <KpiCard label="Net profit" value={fmt(s.profit)} icon={TrendingUp} color={(s.profit >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100")} sub={`${s.margin.toFixed(1)}% margin`} delta={g!.profitChangePct} />
            <KpiCard label="Product revenue" value={fmt(s.merchRevenue)} icon={ShoppingBag} color="text-blue-600 bg-blue-100" sub="Net of discounts" />
            <KpiCard label="Delivery fees" value={fmt(s.deliveryFees)} icon={Truck} color="text-cyan-600 bg-cyan-100" sub="100% shop profit" />
            <KpiCard label="Discounts given" value={fmt(s.discounts)} icon={Percent} color="text-rose-600 bg-rose-100" sub={s.revenue > 0 ? `${((s.discounts / (s.revenue + s.discounts || 1)) * 100).toFixed(1)}% of gross` : "—"} />
          </div>

          <Card title="How these numbers are calculated">
            <p className="rounded-lg bg-muted/20 p-3 text-xs leading-relaxed text-muted">
              <b className="text-foreground">Net profit = product margin + delivery fees</b>, where product margin uses the
              price and cost captured on each order at the time it was placed — not today&apos;s catalogue. The delivery fee the
              customer pays is <b className="text-foreground">shop profit</b> and is included in both revenue and profit.
              Delivery-boy commissions are tracked separately on the Earnings page and are <b className="text-foreground">not</b> deducted here.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted">Reconciliation check</p>
                <p className="mt-1 text-sm">
                  Stored order totals: <b>{fmt(data.reconciliation.storedTotal)}</b>
                </p>
                <p className="text-sm">
                  Computed revenue: <b>{fmt(data.reconciliation.computedRevenue)}</b>
                </p>
                <p className={`mt-1 text-xs ${Math.abs(data.reconciliation.delta) < 1 ? "text-emerald-600" : "text-amber-600"}`}>
                  {Math.abs(data.reconciliation.delta) < 1
                    ? "✓ Matches — these two figures should always agree"
                    : `Difference ${fmtSigned(data.reconciliation.delta)} (legacy orders with no price snapshot)`}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted">Previous period</p>
                <p className="mt-1 text-sm">{g!.from} → {g!.to}</p>
                <p className="text-sm">Revenue <b>{fmt(g!.revenue)}</b> · Profit <b>{fmt(g!.profit)}</b></p>
                <p className="text-sm">Orders <b>{g!.orderCount}</b> · AOV <b>{fmt(g!.aov)}</b></p>
              </div>
            </div>
          </Card>

          <Card title="Daily profit" hint="Zero-sales days are included so the trend is honest">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" tick={AXIS} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} />
                  <YAxis tick={AXIS} tickFormatter={(v: number) => "₹" + (v >= 1000 ? Math.round(v / 1000) + "k" : v)} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2D7D3A" radius={[3, 3, 0, 0]} name="Revenue" />
                  <Bar dataKey="cost" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Cost" />
                  <Bar dataKey="profit" fill="#2563eb" radius={[3, 3, 0, 0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Profit by category" hint="Product-level profit; delivery fees are not attributed to a category">
            <DataTable
              rows={data.categories}
              rowKey={(r) => r.category}
              caption="Profit by category"
              pageSize={8}
              exportName={`profit-by-category-${data.range.from}_${data.range.to}`}
              searchFields={(r) => catLabel(r.category)}
              initialSort={{ key: "profit", dir: "desc" }}
              columns={[
                { key: "cat", header: "Category", sortValue: (r) => r.category, render: (r) => <span className="font-medium">{catLabel(r.category)}</span> },
                { key: "orders", header: "Orders", align: "right", sortValue: (r) => r.orders, render: (r) => r.orders },
                { key: "qty", header: "Qty", align: "right", sortValue: (r) => r.qty, render: (r) => r.qty },
                { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.revenue, render: (r) => fmt(r.revenue) },
                { key: "cost", header: "Cost", align: "right", sortValue: (r) => r.cost, render: (r) => <span className="text-orange-600">{fmt(r.cost)}</span> },
                { key: "profit", header: "Profit", align: "right", sortValue: (r) => r.profit, render: (r) => <span className={r.profit >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{fmt(r.profit)}</span> },
                { key: "margin", header: "Margin", align: "right", sortValue: (r) => r.margin, render: (r) => `${r.margin.toFixed(1)}%` },
              ]}
            />
          </Card>
        </div>
      )}

      {/* ══════════════ PRODUCTS ══════════════ */}
      {tab === "products" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Products sold" value={s.itemsSold} icon={PackageOpen} color="text-purple-600 bg-purple-100" sub={`${data.topProducts.length} distinct lines`} />
            <KpiCard label="Items per order" value={s.avgItemsPerOrder.toFixed(1)} icon={Layers} color="text-blue-600 bg-blue-100" />
            <KpiCard label="Best margin" value={data.topProducts.length ? `${Math.max(...data.topProducts.map((p) => p.margin)).toFixed(0)}%` : "—"} icon={Target} color="text-emerald-600 bg-emerald-100" />
            <KpiCard label="Weight tiers sold" value={data.weightMix.length} icon={Wallet} color="text-cyan-600 bg-cyan-100" />
          </div>

          <Card title="Product profitability" hint="Sorted by profit. Click any column header to re-sort.">
            <DataTable
              rows={data.topProducts}
              rowKey={(r) => r.id}
              caption="Product profitability"
              pageSize={15}
              exportName={`products-${data.range.from}_${data.range.to}`}
              searchFields={(r) => `${r.name} ${r.category}`}
              initialSort={{ key: "profit", dir: "desc" }}
              columns={productCols}
            />
          </Card>

          <Card title="Revenue share" hint="Top 8 products by revenue">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.topProducts.slice(0, 8).map((p) => ({ name: p.name, value: p.revenue }))} dataKey="value" nameKey="name" outerRadius={90} label={(e: { name?: string }) => e.name?.slice(0, 14)}>
                    {data.topProducts.slice(0, 8).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Which pack sizes sell" hint="Revenue by the weight the customer chose">
            <DataTable
              rows={data.weightMix}
              rowKey={(r) => r.weight}
              caption="Revenue by weight"
              pageSize={12}
              searchable={false}
              exportName={`weight-mix-${data.range.from}_${data.range.to}`}
              initialSort={{ key: "revenue", dir: "desc" }}
              columns={[
                { key: "weight", header: "Weight", sortValue: (r) => r.weight, render: (r) => <span className="font-medium">{r.weight}</span> },
                { key: "qty", header: "Units", align: "right", sortValue: (r) => r.qty, render: (r) => r.qty },
                { key: "orders", header: "Lines", align: "right", sortValue: (r) => r.orders, render: (r) => r.orders },
                { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.revenue, render: (r) => fmt(r.revenue) },
              ]}
            />
          </Card>
        </div>
      )}

      {/* ══════════════ CUSTOMERS ══════════════ */}
      {tab === "customers" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Customers" value={data.customers.totalCustomers} icon={Users} color="text-pink-600 bg-pink-100" sub={`${data.customers.lifetimeCustomers} all-time`} />
            <KpiCard label="New customers" value={data.customers.newCustomers} icon={UserPlus} color="text-blue-600 bg-blue-100" sub="First-ever order in range" />
            <KpiCard label="Returning" value={data.customers.returningCustomers} icon={Repeat} color="text-purple-600 bg-purple-100" />
            <KpiCard label="Repeat rate" value={`${data.customers.repeatRate.toFixed(1)}%`} icon={Target} color="text-emerald-600 bg-emerald-100" sub={`${data.customers.avgOrdersPerCustomer.toFixed(1)} orders/customer`} />
          </div>

          <Card title="New vs returning, daily" hint="A customer counts as returning if they had ordered before this range">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.customerTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" tick={AXIS} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} />
                  <YAxis tick={AXIS} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newCustomers" stackId="a" fill="#2563eb" name="New customers" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="repeatOrders" stackId="a" fill="#8B5CF6" name="Returning orders" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Retention by first-order month" hint="Of customers whose first ever order was in that month, how many came back">
            {data.cohorts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Not enough history yet.</p>
            ) : (
              <DataTable
                rows={data.cohorts}
                rowKey={(r) => r.month}
                caption="Retention by cohort month"
                pageSize={12}
                searchable={false}
                exportName={`cohorts-${data.range.from}_${data.range.to}`}
                initialSort={{ key: "month", dir: "desc" }}
                columns={[
                  { key: "month", header: "First-order month", sortValue: (r) => r.month, render: (r) => <span className="font-medium">{r.month}</span> },
                  { key: "customers", header: "Customers", align: "right", sortValue: (r) => r.customers, render: (r) => r.customers },
                  { key: "returned", header: "Came back", align: "right", sortValue: (r) => r.returned, render: (r) => r.returned },
                  {
                    key: "retention", header: "Retention", align: "right", sortValue: (r) => r.retentionPct,
                    render: (r) => (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20"><MiniBar value={r.retentionPct} max={100} tone="blue" /></div>
                        <span className="w-12 text-right tabular-nums">{r.retentionPct.toFixed(0)}%</span>
                      </div>
                    ),
                  },
                  { key: "revenue", header: "Lifetime revenue", align: "right", sortValue: (r) => r.revenue, render: (r) => fmt(r.revenue) },
                ]}
              />
            )}
          </Card>

          <Card title="Top customers by spend" hint="Search by name, email or phone">
            <DataTable
              rows={data.customers.topSpenders}
              rowKey={(r) => r.email || r.phone || r.name}
              caption="Top customers"
              pageSize={15}
              exportName={`customers-${data.range.from}_${data.range.to}`}
              searchFields={(r) => `${r.name} ${r.email} ${r.phone}`}
              initialSort={{ key: "spend", dir: "desc" }}
              columns={customerCols}
            />
          </Card>
        </div>
      )}

      {/* ══════════════ DEMAND ══════════════ */}
      {tab === "demand" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Busiest day" value={data.peak.day.label} icon={CalendarDays} color="text-green-600 bg-green-100" sub={`${data.peak.day.orders} orders`} />
            <KpiCard label="Busiest hour" value={`${data.peak.hour.hour % 12 === 0 ? 12 : data.peak.hour.hour % 12}${data.peak.hour.hour < 12 ? "am" : "pm"}`} icon={Clock} color="text-blue-600 bg-blue-100" sub={`${data.peak.hour.orders} orders`} />
            <KpiCard label="Delivery success" value={`${data.orders.deliverySuccessRate.toFixed(1)}%`} icon={CheckCircle2} color="text-emerald-600 bg-emerald-100" />
            <KpiCard label="Cancellations" value={data.orders.cancelled} icon={RotateCcw} color="text-red-600 bg-red-100" sub={`of ${data.orders.total} orders`} />
          </div>

          <Card title="When customers order" hint="Day of week × hour of day, in IST">
            <DemandHeatmap
              dayLabels={data.heatmap.dayLabels}
              hours={data.heatmap.hours}
              orders={data.heatmap.orders}
              revenue={data.heatmap.revenue}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Orders by day of week" hint="All-time weekly pattern for this range">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dow} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis dataKey="short" tick={AXIS} />
                    <YAxis tick={AXIS} allowDecimals={false} />
                    <Tooltip formatter={(v, n) => (n === "orders" ? Number(v) : fmt(Number(v)))} />
                    <Bar dataKey="orders" fill="#2D7D3A" radius={[4, 4, 0, 0]} name="orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Orders by hour of day" hint="IST — useful for staffing and delivery slots">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.hour} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                    <XAxis dataKey="hour" tick={AXIS} tickFormatter={(h: number) => `${h}`} interval={1} />
                    <YAxis tick={AXIS} allowDecimals={false} />
                    <Tooltip labelFormatter={(h) => `${h}:00 – ${h}:59`} formatter={(v) => Number(v)} />
                    <Line type="stepAfter" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={false} name="orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════ ZONES ══════════════ */}
      {tab === "zones" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.zones.buckets.map((z) => (
              <KpiCard key={z.label} label={z.label} value={fmt(z.revenue)} icon={MapPin} color="text-cyan-600 bg-cyan-100" sub={`${z.orders} orders · AOV ${fmt(z.aov)}`} />
            ))}
          </div>

          <Card title="Delivery volume by distance" hint="Customer delivery fee is included in revenue">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.zones.buckets} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="label" tick={AXIS} />
                  <YAxis tick={AXIS} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Orders" />
                  <Bar dataKey="revenue" fill="#2D7D3A" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="Top delivery areas"
            hint={`${data.zones.missingDistance} order(s) had no GPS distance recorded`}
          >
            <DataTable
              rows={data.zones.areas}
              rowKey={(r) => r.area}
              caption="Top delivery areas"
              pageSize={12}
              exportName={`areas-${data.range.from}_${data.range.to}`}
              initialSort={{ key: "revenue", dir: "desc" }}
              columns={areaCols}
            />
          </Card>

          {data.zones.outOfRange > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-amber-800">
                <b>{data.zones.outOfRange}</b> delivered order(s) could not be placed in a distance band — either no GPS
                coordinates were captured, or the distance falls outside every configured tier. Review the delivery-zone tiers if
                this number keeps growing.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
