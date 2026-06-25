"use client";

import { use, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock, XCircle, AlertTriangle, Copy, KeyRound, Ban, Loader2,
  Package, ShoppingBag, Truck, CheckCircle,
} from "lucide-react";
import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReturnPolicyBanner, ReturnRequestModal, isWithinReplacementWindow, getRemainingTime } from "@/components/ui/return-policy";
import { useOrderStore } from "@/store/order-store";
import { useToast } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), { ssr: false });

const stages = [
  { id: "received", label: "Order Received", icon: Package, sub: "Preparing your order…" },
  { id: "out_for_delivery", label: "Out For Delivery", icon: Truck, sub: "Heading to pickup" },
  { id: "picked_up", label: "Picked Up", icon: ShoppingBag, sub: "On the way to you" },
  { id: "delivered", label: "Delivered", icon: CheckCircle, sub: "Enjoy your fresh groceries!" },
];

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReturn, setShowReturn] = useState(false);
  const [boyLocation, setBoyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState("");
  const [speed, setSpeed] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();
  const { cancelOrder } = useOrderStore();

  const fetchOrder = useCallback(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        const raw = json.order as Record<string, unknown>;
        if (!raw) { setOrder(null); return; }
        setOrder({
          id: raw.id as string,
          items: ((raw.items as any[]) ?? []).map((i: any) => ({
            product: {
              id: i.product?.id ?? "",
              slug: i.product?.slug ?? i.product?.id ?? "",
              name: i.product?.name ?? "Item",
              description: i.product?.description ?? "",
              category: i.product?.category ?? "fish",
              price: i.product?.price ?? 0,
              image: i.product?.image ?? "",
              unit: i.product?.unit ?? "piece",
              inStock: i.product?.inStock ?? i.product?.in_stock ?? true,
              rating: i.product?.rating ?? 0,
              reviewCount: i.product?.reviewCount ?? i.product?.review_count ?? 0,
              freshnessScore: i.product?.freshnessScore ?? i.product?.freshness_score ?? 4,
              deliveryEta: i.product?.deliveryEta ?? i.product?.delivery_eta ?? 60,
            },
            quantity: i.quantity ?? 1,
          })) ?? [],
          status: raw.status as Order["status"],
          total: raw.total as number,
          createdAt: raw.created_at as string,
          address: (raw.address_snapshot ?? raw.address ?? {}) as Order["address"],
          eta: (raw.eta as number) ?? 30,
          customerName: (raw.customer_name as string) ?? "",
          customerPhone: (raw.customer_phone as string) ?? "",
          customerEmail: (raw.customer_email as string) ?? "",
          paymentMethod: (raw.payment_method as string) ?? "cod",
          paymentStatus: (raw.payment_status as Order["paymentStatus"]) ?? "unpaid",
          deliveryBoyId: (raw.delivery_boy_id as string) ?? undefined,
          deliveryBoyName: (raw.delivery_boy_name as string) ?? undefined,
          deliveryStatus: (raw.delivery_status as Order["deliveryStatus"]) ?? undefined,
          deliveryCode: (raw.delivery_code as string) ?? "",
          returnRequested: raw.return_requested as boolean | undefined,
          returnApproved: raw.return_approved as boolean | undefined,
        });
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : null);
      toast.add("Order cancelled. Refund will be processed within 3-5 days if already paid.");
      setShowCancel(false);
    } catch {
      toast.add("Failed to cancel order. Try again.", "error");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    if (!etaMinutes || etaMinutes <= 0) return;
    const timer = setInterval(() => {
      setEtaMinutes((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 60000);
    return () => clearInterval(timer);
  }, [etaMinutes]);

  useEffect(() => {
    if (etaMinutes !== null && etaMinutes <= 0) {
      setEtaMinutes(null);
    }
  }, [etaMinutes]);

  useEffect(() => {
    if (!order || order.status === "cancelled" || order.status === "delivered") return;

    const fetchLocation = () => {
      fetch(`/api/delivery/location?order_id=${orderId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.location) {
            const loc = json.location;
            setBoyLocation({ lat: loc.lat, lng: loc.lng });
            setSpeed(loc.speed ?? 0);
            setLastUpdated(loc.updated_at ?? "");
            if (order.address?.lat && order.address?.lng) {
              const d = calcDistance(loc.lat, loc.lng, order.address.lat, order.address.lng);
              setDistance(d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
              const speedKmph = (loc.speed ?? 0) * 3.6;
              if (speedKmph > 1) {
                const etaH = d / speedKmph;
                setEtaMinutes(Math.max(1, Math.round(etaH * 60)));
              } else {
                setEtaMinutes(null);
              }
            }
          }
        })
        .catch(() => {});
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000);
    return () => clearInterval(interval);
  }, [order, orderId]);

  const isCancelled = order?.status === "cancelled";
  const currentStage = (() => {
    if (order?.status === "delivered") return 3;
    if (order?.deliveryStatus === "picked_up") return 2;
    if (order?.status === "out_for_delivery") return 1;
    return 0;
  })();
  const isDelivered = order?.status === "delivered";
  const deliveredAt = order?.createdAt;
  const isOutForDelivery = order?.status === "out_for_delivery";

  const customerLoc = order?.address?.lat && order?.address?.lng
    ? [order.address.lat, order.address.lng] as [number, number]
    : null;

  const mapCenter: [number, number] = boyLocation
    ? [boyLocation.lat, boyLocation.lng] as unknown as [number, number]
    : customerLoc ?? [26.7319, 88.4256];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-12 w-12 mb-4 text-[#80949b]" />
        <h2 className="text-lg font-bold">Loading order...</h2>
        <p className="mt-1 text-sm text-muted">Looking up order {orderId}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-12 w-12 mb-4 text-[#80949b]" />
        <h2 className="text-lg font-bold">Order not found</h2>
        <p className="mt-1 text-sm text-muted">No order with ID {orderId}</p>
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
            Your order <span className="font-semibold text-white">{orderId}</span> was cancelled.
          </p>
          {order.paymentStatus === "paid" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-orange/10 px-4 py-2.5 text-sm text-brand-orange">
              <AlertTriangle className="h-4 w-4" />
              Refund will be processed within 3-5 business days
            </div>
          )}
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-[#0d1b2a] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-lg">📦</div>
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2ecc71]/10 px-3 py-1 text-[11px] font-semibold text-[#2ecc71] mb-3">
          <span className="live-dot relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ecc71] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2ecc71]" />
          </span>
          LIVE TRACKING
        </span>
        <h1 className="text-2xl font-extrabold text-white">Order {orderId}</h1>
        {isOutForDelivery && (
          <div className="mt-2 flex flex-col items-center gap-1">
            {distance && (
              <p className="text-sm text-[#80949b] flex items-center justify-center gap-1">
                <Truck className="h-4 w-4 inline text-[#2ecc71]" /> {distance} away
              </p>
            )}
            {etaMinutes !== null && etaMinutes > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#2ecc71]/10 border border-[#2ecc71]/20 px-4 py-1.5">
                <Clock className="h-4 w-4 text-[#2ecc71]" />
                <span className="text-sm font-bold text-white tabular-nums">
                  Arriving in ~{etaMinutes} min
                </span>
              </div>
            )}
            {lastUpdated && (
              <p className="text-[10px] text-[#5a7278]">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
        {!isOutForDelivery && !isDelivered && (
          <p className="mt-1 text-sm text-[#80949b]">Estimated delivery: 30 min — 1 hour</p>
        )}
      </div>

      {/* Cancel Order */}
      {order.status === "received" && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowCancel(true)}
            className="text-[11px] text-[#80949b] hover:text-[#e74c3c] underline underline-offset-2 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      )}

      {/* Live Map */}
      <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/5">
        {isOutForDelivery ? (
          <LiveMap
            center={mapCenter}
            markers={[
              ...(boyLocation ? [{ position: [boyLocation.lat, boyLocation.lng] as [number, number], icon: "boy" as const, label: "Delivery Partner" }] : []),
              ...(customerLoc ? [{ position: customerLoc, icon: "customer" as const, label: "Your Location" }] : []),
            ]}
            className="h-72 w-full"
          />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center bg-gradient-to-br from-brand-fresh/5 to-brand-blue/5 sm:h-64">
            <span className="text-4xl">📦</span>
            <p className="mt-2 text-sm font-medium text-muted">
              {order.status === "received" ? "Preparing your order..." : "Delivered!"}
            </p>
          </div>
        )}
        {isOutForDelivery && boyLocation && (
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-xl bg-[#0d1b2a]/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            <span className="live-dot relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ecc71] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2ecc71]" />
            </span>
            <span className="text-white">Live</span>
            {speed > 0 && (
              <span className="text-[#80949b] ml-1 font-mono">{(speed * 3.6).toFixed(1)} km/h</span>
            )}
          </div>
        )}
      </div>

      {/* Delivery Code */}
      {order.deliveryCode && (isOutForDelivery || order.status === "delivered") && (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-[#2ecc71]/30 bg-[#2ecc71]/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <KeyRound className="h-4 w-4 text-[#2ecc71]" />
            <p className="text-xs font-semibold text-[#80949b]">
              {isDelivered ? "Delivery code used" : "Share this code with delivery partner"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-[0.15em] text-white select-all">
              {order.deliveryCode}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(order.deliveryCode!); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
              title="Copy code"
            >
              <Copy className="h-4 w-4 text-[#80949b]" />
            </button>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-[#5a7278]">
              <Clock className="h-3.5 w-3.5" /> Replacement window expired
            </div>
          )}
        </div>
      )}

      {showReturn && deliveredAt && (
        <ReturnRequestModal orderId={orderId} deliveredAt={deliveredAt} onClose={() => setShowReturn(false)} />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-8 sm:px-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border/30 bg-[#0d1b2a] p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 mb-4">
              <Ban className="h-8 w-8 text-brand-red" />
            </div>
            <h3 className="text-center text-lg font-bold">Cancel Order?</h3>
            <p className="mt-2 text-center text-sm text-muted">
              This action cannot be undone. Your order <span className="font-semibold">{orderId}</span> will be cancelled.
            </p>
            {order?.paymentStatus === "paid" && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-orange/10 px-4 py-2.5 text-xs text-brand-orange">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Refund will be processed within 3-5 business days
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl py-2.5 text-sm"
                onClick={() => setShowCancel(false)}
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

      {/* Status Card */}
      <div className="glass rounded-2xl border border-white/10 p-8 text-center mt-6 mb-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2ecc71]/15 flex items-center justify-center mb-4">
          {isDelivered ? <CheckCircle className="h-8 w-8" /> : isOutForDelivery ? <Truck className="h-8 w-8" /> : <Package className="h-8 w-8" />}
        </div>
        <p className="text-sm font-bold text-[#c2d0c9]">
          {isDelivered ? "Delivered!" : order?.deliveryStatus === "picked_up" ? "On the way to you!" : isOutForDelivery ? "Heading to pickup" : "Preparing your order…"}
        </p>
      </div>

      {/* Timeline */}
      <div className="mt-8">
        {stages.map((stage, i) => {
          const isActive = i <= currentStage;
          const isCurrent = i === currentStage;
          return (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                    isActive ? "bg-[#2ecc71] text-[#0a1f1c]" : "bg-white/5 border border-white/10 text-[#80949b]"
                  }`}
                >
                  {(() => { const Icon = stage.icon; return <Icon className="h-5 w-5" />; })()}
                </motion.div>
                {i < stages.length - 1 && (
                  <div className={`h-12 w-0.5 ${i < currentStage ? "bg-[#2ecc71]" : "bg-white/10"}`} />
                )}
              </div>
              <div className="pb-8 pt-2">
                <p className={`text-sm font-bold ${isActive ? "text-white" : "text-[#80949b]"}`}>
                  {stage.label}
                </p>
                {isCurrent && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#2ecc71]">
                    {stage.sub}
                  </motion.p>
                )}
                {isActive && !isCurrent && <p className="text-xs text-[#2ecc71]">Completed</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
