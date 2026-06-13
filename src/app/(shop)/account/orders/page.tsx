"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ChevronRight, RotateCcw, Clock, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ReturnRequestModal, isWithinReplacementWindow, getRemainingTime } from "@/components/ui/return-policy";

interface OrderSummary {
  id: string;
  date: string;
  total: number;
  items: number;
  status: string;
  deliveredAt?: string;
}

export default function OrdersPage() {
  const [orders] = useState<OrderSummary[]>([]);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnDeliveredAt, setReturnDeliveredAt] = useState<string | undefined>();

  const handleReturn = (order: OrderSummary) => {
    setReturnOrderId(order.id);
    setReturnDeliveredAt(order.deliveredAt);
  };

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
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-fresh/10">
                    <Package className="h-5 w-5 text-brand-fresh" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{order.id}</p>
                    <p className="text-xs text-muted">
                      {order.date} · {order.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                    <Badge variant="fresh" className="mt-1">
                      {order.status}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
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
    </div>
  );
}
