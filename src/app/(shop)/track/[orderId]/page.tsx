"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReturnPolicyBanner, ReturnRequestModal, isWithinReplacementWindow, getRemainingTime } from "@/components/ui/return-policy";
import { useOrderStore } from "@/store/order-store";

const stages = [
  { id: "received", label: "Order Received", icon: Package },
  { id: "out_for_delivery", label: "Out For Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle },
];

const stageIndex: Record<string, number> = { received: 0, out_for_delivery: 1, delivered: 2 };

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { orders, loadOrders } = useOrderStore();
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const order = orders.find((o) => o.id === orderId);
  const isCancelled = order?.status === "cancelled";
  const currentStage = order ? (stageIndex[order.status] ?? 0) : 0;
  const isDelivered = order?.status === "delivered";
  const deliveredAt = order?.createdAt;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="mb-4 h-12 w-12 text-muted" />
        <h2 className="text-lg font-bold">Loading order...</h2>
        <p className="mt-1 text-sm text-muted">Looking up order {orderId}</p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="py-6">
        <div className="text-center">
          <Badge variant="red" className="mb-3">Cancelled</Badge>
          <h1 className="text-2xl font-extrabold">Order {orderId}</h1>
          <p className="mt-2 text-sm text-muted">This order has been cancelled</p>
        </div>

        <div className="mt-12 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10">
            <XCircle className="h-10 w-10 text-brand-red" />
          </div>
          <h3 className="mt-4 text-lg font-bold">Order Cancelled</h3>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Your order <span className="font-semibold text-brand-dark">{orderId}</span> was cancelled. No payment has been processed.
          </p>
          {order.paymentStatus === "paid" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-orange/10 px-4 py-2.5 text-sm text-brand-orange">
              <AlertTriangle className="h-4 w-4" />
              Refund will be processed within 3-5 business days
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-5 w-5 text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{order.items.length} item{order.items.length > 1 ? "s" : ""}</p>
              <p className="text-xs text-muted">{order.items.map((i) => i.product.name).join(", ")}</p>
            </div>
            <p className="text-sm font-bold">₹{order.total}</p>
          </div>
        </div>
      </div>
    );
  }

  const inWindow = isDelivered && deliveredAt && isWithinReplacementWindow(deliveredAt);

  return (
    <div className="py-6">
      <div className="text-center">
        <Badge variant="fresh" className="mb-3">Live Tracking</Badge>
        <h1 className="text-2xl font-extrabold">Order {orderId}</h1>
        <p className="mt-1 text-muted">Estimated delivery: 30 min — 1 hour</p>
      </div>

      {/* Map placeholder */}
      <div className="relative mt-8 h-48 overflow-hidden rounded-2xl glass-card sm:h-64">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-fresh/10 to-brand-blue/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-brand-fresh" />
            <p className="mt-2 text-sm font-medium">Delivery partner is on the way</p>
            <p className="text-xs text-muted">2.3 km away · Hill Cart Road</p>
          </div>
        </div>
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute right-1/4 top-1/3"
        >
          <Truck className="h-6 w-6 text-brand-blue" />
        </motion.div>
      </div>

      {/* Return / replacement */}
      {isDelivered && (
        <div className="mt-6 space-y-3">
          <ReturnPolicyBanner deliveredAt={deliveredAt} />
          {inWindow ? (
            <button onClick={() => setShowReturn(true)}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface transition-colors">
              Request Replacement ({deliveredAt ? getRemainingTime(deliveredAt) : "3 hours"})
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" /> Replacement window expired
            </div>
          )}
        </div>
      )}

      {showReturn && deliveredAt && (
        <ReturnRequestModal orderId={orderId} deliveredAt={deliveredAt} onClose={() => setShowReturn(false)} />
      )}

      {/* Timeline */}
      <div className="mt-8 space-y-0">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i <= currentStage;
          const isCurrent = i === currentStage;
          return (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isActive ? "bg-brand-fresh text-white" : "bg-brand-dark/5 text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                {i < stages.length - 1 && (
                  <div className={`h-12 w-0.5 ${i < currentStage ? "bg-brand-fresh" : "bg-brand-dark/10"}`} />
                )}
              </div>
              <div className="pb-8 pt-2">
                <p className={`text-sm font-semibold ${isActive ? "text-brand-dark" : "text-muted"}`}>
                  {stage.label}
                </p>
                {isCurrent && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-brand-fresh">
                    {order.status === "received" ? "Preparing your order..." : "In progress..."}
                  </motion.p>
                )}
                {isActive && !isCurrent && <p className="text-xs text-muted">Completed</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
