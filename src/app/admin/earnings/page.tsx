"use client";

import { useState, useEffect } from "react";
import { Loader2, IndianRupee, Truck, TrendingUp, Receipt } from "lucide-react";

interface EarningsData {
  total: number;
  payouts: number;
  weekTotal: number;
  weekPayouts: number;
  byBoy: { boyId: string; name: string; total: number; count: number }[];
  recent: { id: string; boyId: string; boyName: string; orderId: string; amount: number; orderTotal: number; createdAt: string }[];
}

export default function AdminEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/earnings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>;
  }

  if (!data) {
    return <div className="py-10 text-center text-sm text-muted">Failed to load earnings. Run the feature migration first.</div>;
  }

  const cards = [
    { label: "Total Payouts", value: "₹" + data.total.toLocaleString("en-IN"), icon: IndianRupee, color: "text-green-600 bg-green-100" },
    { label: "Deliveries Paid", value: data.payouts, icon: Receipt, color: "text-blue-600 bg-blue-100" },
    { label: "This Week", value: "₹" + data.weekTotal.toLocaleString("en-IN"), icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
    { label: "Week Deliveries", value: data.weekPayouts, icon: Truck, color: "text-cyan-600 bg-cyan-100" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Delivery Earnings</h2>
      <p className="text-sm text-muted">Per-delivery payouts ledger</p>

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
          <h3 className="font-bold">By Delivery Boy</h3>
          <div className="mt-4 space-y-3">
            {data.byBoy.length === 0 && <p className="text-sm text-muted">No payouts yet.</p>}
            {data.byBoy.map((b) => (
              <div key={b.boyId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted">{b.count} deliveries</p>
                </div>
                <span className="text-sm font-bold">₹{b.total.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-6 shadow-sm">
          <h3 className="font-bold">Recent Payouts</h3>
          <div className="mt-4 space-y-3">
            {data.recent.length === 0 && <p className="text-sm text-muted">No payouts recorded yet.</p>}
            {data.recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.orderId}</p>
                  <p className="text-xs text-muted">{r.boyName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="text-sm font-bold">₹{r.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
