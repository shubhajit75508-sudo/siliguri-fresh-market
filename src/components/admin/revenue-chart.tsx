"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";

interface DailyData {
  date: string;
  revenue: number;
  orderCount: number;
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
          setData(json.daily.map((d: DailyData) => ({ date: d.date, revenue: d.revenue, orderCount: d.orderCount })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  return (
    <div className="rounded-xl border bg-surface p-6 shadow-sm">
      <h3 className="mb-4 font-bold text-foreground">Revenue Overview (30 Days)</h3>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-light" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-light">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1f2937",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(v) => `Date: ${v}`}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#2D7D3A"
              radius={[4, 4, 0, 0]}
              name="Revenue (₹)"
              maxBarSize={20}
            />
            <Bar
              yAxisId="right"
              dataKey="orderCount"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              name="Orders"
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
