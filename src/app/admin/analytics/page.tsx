"use client";

import { RevenueChart } from "@/components/admin/revenue-chart";

export default function AnalyticsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="text-sm text-gray-500">Business intelligence & performance metrics</p>

      <div className="mt-6">
        <RevenueChart />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold">Revenue by Category</h3>
          <p className="mt-4 text-sm text-gray-400">No data yet.</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold">Customer Retention</h3>
          <p className="mt-4 text-sm text-gray-400">No data yet.</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold">Delivery Performance</h3>
          <p className="mt-4 text-sm text-gray-400">No data yet.</p>
        </div>
      </div>
    </div>
  );
}
