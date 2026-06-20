"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ChevronRight, RotateCcw, Clock, ShoppingBag, Loader2, XCircle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useOrderStore } from "@/store/order-store";
import { useToast } from "@/components/ui/toaster";
import { ReturnRequestModal, isWithinReplacementWindow, getRemainingTime } from "@/components/ui/return-policy";

const statusBadge: Record<string, "default" | "fresh" | "blue" | "red" | "orange"> = {
  received: "default",
  "out for delivery": "blue",
  delivered: "fresh",
  cancelled: "red",
};

interface OrderSummary {
  id: string;
  date: string;
  total: number;
  items: number;
  status: string;
  deliveredAt?: string;
}

export default function OrdersPage() {
  const { orders: allOrders, loaded, loadUserOrders, cancelOrder } = useOrderStore();
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnDeliveredAt, setReturnDeliveredAt] = useState<string | undefined>();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();

  useEffect(() => { loadUserOrders(); }, [loadUserOrders]);

  const orders: OrderSummary[] = allOrders
    .map((o) => ({
    id: o.id,
    date: new Date(o.createdAt).toLocaleDateString(),
    total: o.total,
    items: o.items.length,
    status: o.status.replace(/_/g, " "),
    deliveredAt: o.status === "delivered" ? o.createdAt : undefined,
  }));

  const handleReturn = (order: OrderSummary) => {
    setReturnOrderId(order.id);
    setReturnDeliveredAt(order.deliveredAt);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await cancelOrder(cancelId);
      toast.add("Order cancelled");
      setCancelId(null);
    } catch {
      toast.add("Failed to cancel", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Your Orders</h2>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <ShoppingBag className="mb-3 h-10 w-10 text-muted" />
          <p className="text-sm text-muted">No orders yet</p>
          <Link href="/">
            <Button variant="fresh" className="mt-4">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const inWindow = isWithinReplacementWindow(order.deliveredAt);
            return (
              <div
                key={order.id}
                className="glass-card rounded-2xl p-4 transition-all hover:shadow-lg"
              >
                <Link
                  href={`/track/${order.id}`}
                  className="flex items-center gap-4"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${order.status === "cancelled" ? "bg-brand-red/10" : "bg-brand-fresh/10"}`}>
                    {order.status === "cancelled" ? (
                      <XCircle className="h-5 w-5 text-brand-red" />
                    ) : (
                      <Package className="h-5 w-5 text-brand-fresh" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{order.id}</p>
                    <p className="text-xs text-muted">
                      {order.date} · {order.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                    <Badge variant={statusBadge[order.status] ?? "default"} className="mt-1">
                      {order.status}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
                {order.status === "cancelled" && (
                  <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red/5 py-2 text-xs text-brand-red">
                    <XCircle className="h-3.5 w-3.5" />
                    This order was cancelled
                  </div>
                )}
                {order.status === "received" && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCancelId(order.id); }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-red/20 bg-brand-red/5 py-2 text-xs font-semibold text-brand-red hover:bg-brand-red/10 transition-colors"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Cancel Order
                  </button>
                )}
                {order.status === "delivered" && (
                  inWindow ? (
                    <button
                      onClick={() => handleReturn(order)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-brand-dark"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Request Replacement ({getRemainingTime(order.deliveredAt!)})
                    </button>
                  ) : (
                    <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-2 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      Replacement window expired
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {returnOrderId && (
        <ReturnRequestModal
          orderId={returnOrderId}
          deliveredAt={returnDeliveredAt}
          onClose={() => { setReturnOrderId(null); setReturnDeliveredAt(undefined); }}
        />
      )}

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-8 sm:px-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border/30 bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 mb-4">
              <Ban className="h-8 w-8 text-brand-red" />
            </div>
            <h3 className="text-center text-lg font-bold">Cancel Order?</h3>
            <p className="mt-2 text-center text-sm text-muted">
              This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl py-2.5 text-sm"
                onClick={() => setCancelId(null)}
                disabled={cancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="default"
                className="flex-1 rounded-xl py-2.5 text-sm bg-brand-red hover:bg-brand-red/90"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Ban className="mr-1 h-4 w-4" />}
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
