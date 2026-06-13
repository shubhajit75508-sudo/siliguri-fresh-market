"use client";

import { useMemo } from "react";
import { Truck, MapPin, Clock, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useOrderStore } from "@/store/order-store";
import { useDeliveryStore } from "@/store/delivery-store";

export default function DeliveryPage() {
  const { orders } = useOrderStore();
  const { assignments } = useDeliveryStore();

  const activeDeliveries = orders.filter(
    (o) => o.deliveryStatus && o.deliveryStatus !== "delivered" && o.deliveryStatus !== "pending"
  );

  const activePartners = useMemo(() => {
    const assignedBoyIds = new Set(orders.filter((o) => o.deliveryBoyId).map((o) => o.deliveryBoyId));
    return assignedBoyIds.size;
  }, [orders]);

  const avgTime = useMemo(() => {
    const delivered = assignments.filter((a) => a.deliveredAt);
    if (delivered.length === 0) return null;
    const totalMinutes = delivered.reduce((sum, a) => {
      const start = new Date(a.assignedAt).getTime();
      const end = new Date(a.deliveredAt!).getTime();
      return sum + (end - start) / 60000;
    }, 0);
    return Math.round(totalMinutes / delivered.length);
  }, [assignments]);

  return (
    <div>
      <h2 className="text-2xl font-bold">Delivery Management</h2>
      <p className="text-sm text-muted">{activeDeliveries.length} active · {assignments.length} total</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          <Truck className="h-8 w-8 text-brand-blue" />
          <div>
            <p className="text-xl font-bold">{activeDeliveries.length}</p>
            <p className="text-sm text-gray-500">Active Deliveries</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          <Clock className="h-8 w-8 text-brand-fresh" />
          <div>
            <p className="text-xl font-bold">{avgTime ? `${avgTime} min` : "--"}</p>
            <p className="text-sm text-gray-500">Avg Delivery Time</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          <MapPin className="h-8 w-8 text-brand-purple" />
          <div>
            <p className="text-xl font-bold">{activePartners}</p>
            <p className="text-sm text-gray-500">Active Partners</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="font-bold">Current Deliveries</h3>
        {activeDeliveries.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <Truck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">No deliveries in progress.</p>
          </div>
        ) : (
          activeDeliveries.map((order) => {
            const assignment = assignments.find((a) => a.orderId === order.id);
            return (
              <div key={order.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{order.id}</p>
                      <Badge variant={order.deliveryStatus === "assigned" ? "blue" : order.deliveryStatus === "accepted" ? "orange" : "fresh"}>
                        {order.deliveryStatus?.replace(/_/g, " ") ?? "Pending"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{order.customerName} · {order.customerPhone}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <MapPin className="h-3 w-3" />
                  {order.address.line1}, {order.address.city} — {order.address.pincode}
                </div>
                {assignment && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Package className="h-3 w-3" />
                    {assignment.items.length} items · {assignment.items.map((i) => i.name).join(", ")}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}