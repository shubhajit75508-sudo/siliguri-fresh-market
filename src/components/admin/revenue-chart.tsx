"use client";

import { useState, useEffect } from "react";
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, ComposedChart } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

interface DailyData {
  date: string;
  revenue: number;
  orderCount: number;
  profit?: number;
}

const ORANGE = "#ff7a1a";
const GRID = "rgba(255,255,255,0.05)";
const TICK = "#6a737f";

/** Compact ₹ axis label: 1.2L / 45k, so long ranges stay readable. */
function money(v: number): string {
  const n = Math.abs(v);
  if (n >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(Math.round(v));
}

export function RevenueChart() {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    // Same canonical endpoint as the analytics page, so the dashboard chart and
    // the analytics screen can never report different revenue.
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    fetch(`/api/admin/growth?from=${iso(from)}&to=${iso(to)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (Array.isArray(json?.daily)) {
          setData(
            json.daily.map((d: DailyData) => ({
              date: d.date,
              revenue: d.revenue,
              orderCount: d.orderCount,
              profit: d.profit,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const hasProfit = data.some((d) => typeof d.profit === "number");
  const total = data.reduce((s, d) => s + (d.revenue || 0), 0);
  const orders = data.reduce((s, d) => s + (d.orderCount || 0), 0);
  const best = data.reduce<DailyData | null>((m, d) => (!m || (d.revenue || 0) > (m.revenue || 0) ? d : m), null);

  return (
    <div className="adm-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="adm-eyebrow">Last 30 days</p>
          <h3 className="mt-1 text-base font-bold sm:text-lg">Revenue Overview</h3>
        </div>
        {loading ? null : (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="adm-eyebrow">Revenue</p>
              <p className="adm-num text-lg font-extrabold text-[#ff9a3c] sm:text-xl">
                ₹{money(total)}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right">
              <p className="adm-eyebrow">Orders</p>
              <p className="adm-num text-lg font-extrabold sm:text-xl">{orders}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#ff7a1a]" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-light">No data yet.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 5, right: 4, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="adm-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: TICK }}
                tickFormatter={(v) => String(v).slice(5)}
                axisLine={false}
                tickLine={false}
                minTickGap={18}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: TICK }}
                tickFormatter={money}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#101318",
                  border: "1px solid #2a2f38",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 16px 40px -12px rgba(0,0,0,0.9)",
                }}
                labelStyle={{ color: "#f3f5f8", fontWeight: 700, marginBottom: 4 }}
                itemStyle={{ color: "#98a2b0" }}
                formatter={(v, name) => {
                  const n = Number(v ?? 0);
                  const label = name === "Revenue" ? `₹${n.toLocaleString("en-IN")}` : n.toLocaleString("en-IN");
                  return [label, String(name)];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10, color: "#98a2b0" }}
                iconType="circle"
                iconSize={7}
              />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="url(#adm-rev)" radius={[5, 5, 0, 0]} maxBarSize={22} />
              {hasProfit ? (
                <Area yAxisId="left" type="monotone" dataKey="profit" name="Profit" stroke="#4ade80" strokeWidth={2} fill="transparent" dot={false} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>

          {best ? (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-light">
              <TrendingUp className="h-3 w-3 text-[#22c55e]" />
              Best day <span className="adm-num font-semibold text-[#98a2b0]">{best.date}</span> at{" "}
              <span className="adm-num font-semibold text-[#98a2b0]">₹{best.revenue.toLocaleString("en-IN")}</span>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
