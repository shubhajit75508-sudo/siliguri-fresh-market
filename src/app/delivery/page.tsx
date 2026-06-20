"use client";

import { useDeliveryStore } from "@/store/delivery-store";
import { useOrderStore } from "@/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Phone, Package, CheckCircle, Truck, ShoppingBag, Radio, Loader2, ShieldQuestion, KeyRound } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback } from "react";

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  picked_up: "Picked Up",
  delivered: "Delivered",
};

const statusColors: Record<string, "blue" | "orange" | "fresh" | "default"> = {
  assigned: "blue",
  accepted: "orange",
  picked_up: "fresh",
  delivered: "fresh",
};

export default function DeliveryDashboard() {
  const { boy, assignments, confirmDelivery: deliveryConfirm } = useDeliveryStore();
  const { acceptDelivery, pickUpDelivery, confirmDelivery } = useOrderStore();

  const [tracking, setTracking] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef<number | null>(null);

  const active = assignments.filter((a) => a.deliveryBoyId === boy?.id && a.status !== "delivered");
  const activeOrderIds = active.map((a) => a.orderId);

  const sendLocation = useCallback(async (lat: number, lng: number) => {
    if (!boy || activeOrderIds.length === 0) return;
    for (const orderId of activeOrderIds) {
      try {
        await fetch("/api/delivery/location", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliveryBoyId: boy.id, orderId, lat, lng }),
        });
      } catch {}
    }
  }, [boy, activeOrderIds]);

  useEffect(() => {
    if (!boy || activeOrderIds.length === 0) return;

    if (!navigator.geolocation) {
      setGpsError("GPS not supported");
      return;
    }

    setGpsError("");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setTracking(true);
        setGpsError("");
        sendLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setTracking(false);
        setGpsError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [boy, activeOrderIds.join(","), sendLocation]);

  const [deliveryCodes, setDeliveryCodes] = useState<Record<string, string>>({});
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    if (boy) {
      useDeliveryStore.getState().loadAssignments().finally(() => setLoadingAssignments(false));
    } else {
      setLoadingAssignments(false);
    }
  }, [boy?.id]);

  const pickupStatuses = active.filter((a) => a.status === "assigned" || a.status === "accepted");
  const outForDelivery = active.filter((a) => a.status === "picked_up");

  if (loadingAssignments) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted" />
        <p className="text-sm text-muted">Loading deliveries...</p>
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="mb-4 h-12 w-12 text-muted" />
        <h2 className="text-lg font-bold">No Deliveries Assigned</h2>
        <p className="mt-1 text-sm text-muted">You&apos;ll see new orders here as they come in</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Active Deliveries ({active.length})</h2>
        <div className="flex items-center gap-2">
          {tracking ? (
            <span className="flex items-center gap-1.5 text-xs text-brand-fresh">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-fresh" />
              </span>
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-brand-red">
              <Radio className="h-3 w-3" /> GPS {gpsError ? "Error" : "Off"}
            </span>
          )}
        </div>
      </div>

      {pickupStatuses.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wide">Pickup</h3>
          {pickupStatuses.map((a) => (
            <DeliveryCard key={a.id} a={a} />
          ))}
        </div>
      )}

      {outForDelivery.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-brand-fresh uppercase tracking-wide flex items-center gap-1.5">
            <Truck className="h-4 w-4" /> Out for Delivery
          </h3>
          {outForDelivery.map((a) => (
            <DeliveryCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );

  function DeliveryCard({ a }: { a: typeof active[0] }) {
    return (
      <div className="mb-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold">{a.customerName}</p>
              <Badge variant={statusColors[a.status] ?? "blue"}>
                {statusLabels[a.status] ?? a.status}
              </Badge>
              {a.paymentStatus === "paid" ? (
                <Badge variant="fresh">Paid</Badge>
              ) : (
                <Badge variant="orange">COD</Badge>
              )}
              {a.deliveryCode && a.status !== "delivered" && (
                <Badge variant="blue" className="text-xs tracking-widest font-mono">
                  #{a.deliveryCode}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">{a.customerPhone}</p>
            <p className="text-[10px] font-mono text-muted mt-0.5">Order: {a.orderId}</p>
          </div>
          <p className="text-sm font-bold">{formatPrice(a.total)}</p>
        </div>

        <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div>
              <p className="font-medium">{a.address.line1}</p>
              {a.address.area && <p className="text-muted">Area: {a.address.area}</p>}
              {a.address.landmark && <p className="text-muted">Landmark: {a.address.landmark}</p>}
              {a.address.building && (
                <p className="text-muted">
                  {a.address.building}
                  {a.address.flat ? `, Flat ${a.address.flat}` : ""}
                  {a.address.floor ? `, Floor ${a.address.floor}` : ""}
                </p>
              )}
              {a.address.line2 && <p className="text-muted">{a.address.line2}</p>}
              <p className="text-muted">{a.address.city} — {a.address.pincode}</p>
            </div>
          </div>
          {a.address.lat && a.address.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${a.address.lat},${a.address.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-blue/10 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/20"
            >
              <Navigation className="h-3.5 w-3.5" /> Navigate
            </a>
          )}
        </div>

        <details className="mt-3">
          <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted">
            <ShoppingBag className="h-3.5 w-3.5" /> {a.items.length} item{a.items.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-1 pl-5 text-sm text-muted">
            {a.items.map((item, i) => (
              <li key={i}>{item.name} × {item.quantity}</li>
            ))}
          </ul>
        </details>

        <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
          <a
            href={`tel:${a.customerPhone}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted hover:bg-surface"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>

          <div className="ml-auto flex gap-2">
            {a.status === "assigned" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  acceptDelivery(a.orderId);
                  useDeliveryStore.getState().setAssignments(
                    useDeliveryStore.getState().assignments.map((x) =>
                      x.id === a.id ? { ...x, status: "accepted" as const } : x
                    )
                  );
                }}
              >
                <CheckCircle className="mr-1 h-4 w-4" /> Accept
              </Button>
            )}
            {a.status === "accepted" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  pickUpDelivery(a.orderId);
                  useDeliveryStore.getState().setAssignments(
                    useDeliveryStore.getState().assignments.map((x) =>
                      x.id === a.id ? { ...x, status: "picked_up" as const } : x
                    )
                  );
                }}
              >
                <Truck className="mr-1 h-4 w-4" /> Mark Picked Up
              </Button>
            )}
            {a.status === "picked_up" && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-muted" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Enter delivery code"
                    value={deliveryCodes[a.orderId] || ""}
                    onChange={(e) => {
                      setDeliveryCodes({ ...deliveryCodes, [a.orderId]: e.target.value.replace(/\D/g, "").slice(0, 4) });
                      setCodeError(null);
                    }}
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm text-center tracking-[0.25em] font-bold outline-none focus:border-brand-fresh/50"
                  />
                </div>
                {codeError && <p className="text-xs text-brand-red">{codeError}</p>}
                <Button
                  variant="fresh"
                  size="sm"
                  className="w-full"
                  disabled={(deliveryCodes[a.orderId] || "").length < 4}
                  onClick={async () => {
                    const enteredCode = deliveryCodes[a.orderId];
                    if (!enteredCode || enteredCode.length < 4) return;
                    const prevOrders = useOrderStore.getState().orders;
                    try {
                      await confirmDelivery(a.orderId, enteredCode);
                      deliveryConfirm(a.id);
                      setDeliveryCodes({ ...deliveryCodes, [a.orderId]: "" });
                      setCodeError(null);
                    } catch (e) {
                      useOrderStore.setState({ orders: prevOrders });
                      setCodeError(e instanceof Error ? e.message : "Invalid code. Try again.");
                    }
                  }}
                >
                  <CheckCircle className="mr-1 h-4 w-4" /> Confirm Delivery
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
