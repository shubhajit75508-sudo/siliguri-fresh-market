"use client";

import { useDeliveryStore } from "@/store/delivery-store";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function DeliveryHistoryPage() {
  const { assignments } = useDeliveryStore();
  const completed = assignments.filter((a) => a.status === "delivered");

  if (completed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle className="mb-4 h-12 w-12 text-muted" />
        <h2 className="text-lg font-bold">No Completed Deliveries</h2>
        <p className="mt-1 text-sm text-muted">Completed deliveries will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      <h2 className="text-lg font-bold">Completed ({completed.length})</h2>
      {completed.map((a) => (
        <div key={a.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold">{a.customerName}</p>
                <Badge variant="fresh">Delivered</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted">{a.customerPhone}</p>
            </div>
            <p className="text-sm font-bold">{formatPrice(a.total)}</p>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3" /> {a.address.line1}, {a.address.city}
          </div>
          {a.deliveredAt && (
            <p className="mt-1 text-xs text-muted">
              Delivered: {new Date(a.deliveredAt).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
