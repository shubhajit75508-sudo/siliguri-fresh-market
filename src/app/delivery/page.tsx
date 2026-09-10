"use client";

import { useDeliveryStore } from "@/store/delivery-store";
import { useOrderStore } from "@/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, getItemUnitPrice } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import LiveMap from "@/components/maps/LiveMap";
import type { DeliveryAssignment } from "@/types";
import {
  Navigation, MapPin, Phone, Package, CheckCircle, Truck, ShoppingBag, Radio, Loader2, LocateFixed,
  ImageIcon, ClipboardList, Wallet,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────

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

function EarningsCard() {
  const [earnings, setEarnings] = useState<{ total: number; weekTotal: number; deliveries: number; weekDeliveries: number } | null>(null);

  useEffect(() => {
    fetch("/api/delivery/earnings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setEarnings(d))
      .catch(() => {});
  }, []);

  if (!earnings) return null;

  return (
    <div className="rounded-2xl border border-brand-fresh/20 bg-gradient-to-br from-brand-fresh/10 to-transparent p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-fresh/15">
            <Wallet className="h-5 w-5 text-brand-fresh" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Total Earnings</p>
            <p className="text-2xl font-extrabold text-foreground">{formatPrice(earnings.total)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">This Week</p>
          <p className="text-lg font-bold text-brand-fresh">{formatPrice(earnings.weekTotal)}</p>
          <p className="text-xs text-muted mt-0.5">{earnings.weekDeliveries} deliveries</p>
        </div>
      </div>
    </div>
  );
}

// ── Delivery Card ────────────────────────────────────

function DeliveryCard({
  a, currentPosition, customerLocations,
  onAccept, onPickUp,
}: {
  a: DeliveryAssignment;
  currentPosition: [number, number] | null;
  customerLocations: Record<string, [number, number]>;
  onAccept: (orderId: string) => void;
  onPickUp: (orderId: string) => void;
}) {
  return (
    <div className="mb-3 rounded-2xl border border-white/5 bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground">{a.customerName}</p>
            <Badge variant={statusColors[a.status] ?? "blue"}>
              {statusLabels[a.status] ?? a.status}
            </Badge>
            {a.paymentStatus === "paid" ? (
              <Badge variant="fresh">Paid</Badge>
            ) : (
              <Badge variant="orange">COD</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">{a.customerPhone}</p>
          <p className="text-[10px] font-mono text-muted mt-0.5">Order: {a.orderId}</p>
        </div>
        <p className="text-sm font-bold text-foreground">{formatPrice(a.total)}</p>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <div>
            <p className="font-medium text-foreground">{a.address.line1}</p>
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
        {currentPosition && customerLocations[a.orderId] && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">Live Tracking</span>
              <span className="text-[10px] font-mono text-brand-fresh">
                {(() => {
                  const [blat, blng] = currentPosition;
                  const [clat, clng] = customerLocations[a.orderId];
                  const R = 6371; const dLat = (clat - blat) * Math.PI / 180; const dLng = (clng - blng) * Math.PI / 180;
                  const calcA = Math.sin(dLat / 2) ** 2 + Math.cos(blat * Math.PI / 180) * Math.cos(clat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
                  const dist = R * 2 * Math.atan2(Math.sqrt(calcA), Math.sqrt(1 - calcA));
                  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
                })()} away
              </span>
            </div>
            <LiveMap
              center={currentPosition}
              zoom={15}
              markers={[
                { position: currentPosition, icon: "boy", label: "You" },
                { position: customerLocations[a.orderId], icon: "customer", label: a.customerName },
              ]}
              className="h-40 w-full rounded-xl"
            />
          </div>
        )}
      </div>

      <details className="mt-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted">
          <ShoppingBag className="h-3.5 w-3.5" /> {a.items.length} item{a.items.length > 1 ? "s" : ""}
        </summary>
        <ul className="mt-2 space-y-1.5">
          {a.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-xs">
              {item.product.image ? (
                <img src={item.product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface"><ImageIcon className="h-4 w-4 text-muted" /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground truncate">{item.product.name}</span>
                  <span className="shrink-0 font-semibold">{item.quantity} × {formatPrice(getItemUnitPrice(item))}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                  {item.selectedWeight && <span className="rounded bg-brand-fresh/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-fresh">{item.selectedWeight}</span>}
                  {item.selectedCut && <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-blue">{item.selectedCut}</span>}
                  {item.selectedCleaning && <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7C3AED]">{item.selectedCleaning}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3">
        <a
          href={`tel:${a.customerPhone}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-muted hover:bg-white/5"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>

        <div className="ml-auto flex gap-2">
          {a.status === "assigned" && (
            <Button variant="default" size="sm" onClick={() => onAccept(a.orderId)}>
              <CheckCircle className="mr-1 h-4 w-4" /> Accept
            </Button>
          )}
          {a.status === "accepted" && (
            <Button variant="default" size="sm" onClick={() => onPickUp(a.orderId)}>
              <Truck className="mr-1 h-4 w-4" /> Mark Picked Up
            </Button>
          )}
          {a.status === "picked_up" && (
            <div className="w-full rounded-xl border border-dashed border-brand-fresh/30 bg-brand-fresh/5 p-3 text-center">
              <p className="text-xs font-medium text-brand-fresh flex items-center justify-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Delivered on-site
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Awaiting confirmation by admin to close this delivery
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────

const STALE_MS = 48 * 60 * 60 * 1000;

export default function DeliveryDashboard() {
  const { boy, assignments } = useDeliveryStore();
  const { acceptDelivery, pickUpDelivery } = useOrderStore();

  const [tracking, setTracking] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [customerLocations, setCustomerLocations] = useState<Record<string, [number, number]>>({});

  const active = useMemo(() => {
    const now = Date.now();
    return assignments.filter((a) => {
      if (a.deliveryBoyId !== boy?.id || a.status === "delivered") return false;
      const ts = new Date(a.assignedAt).getTime();
      const age = Number.isFinite(ts) ? now - ts : 0;
      return age < STALE_MS;
    });
  }, [assignments, boy?.id]);
  const activeOrderIds = useMemo(() => active.map((a) => a.orderId), [active]);

  // ── Load assigned deliveries + poll for new assignments ──
  useEffect(() => {
    const load = async () => {
      if (useDeliveryStore.getState().boy) {
        await useDeliveryStore.getState().loadAssignments();
      }
      setLoadingAssignments(false);
    };
    load();
    const interval = setInterval(() => {
      if (useDeliveryStore.getState().boy) useDeliveryStore.getState().loadAssignments();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Share GPS while there are active deliveries ──
  const sendLocation = useCallback(async (lat: number, lng: number) => {
    if (!boy || activeOrderIds.length === 0) return;
    setCurrentPosition([lat, lng]);
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

  useEffect(() => {
    const locs: Record<string, [number, number]> = {};
    for (const a of active) {
      if (a.address.lat && a.address.lng) {
        locs[a.orderId] = [a.address.lat, a.address.lng];
      }
    }
    setCustomerLocations(locs);
  }, [active]);

  const handleAcceptDelivery = (orderId: string) => {
    acceptDelivery(orderId);
    useDeliveryStore.getState().setAssignments(
      useDeliveryStore.getState().assignments.map((x) =>
        x.orderId === orderId ? { ...x, status: "accepted" as const } : x
      )
    );
  };

  const handlePickUp = (orderId: string) => {
    pickUpDelivery(orderId);
    useDeliveryStore.getState().setAssignments(
      useDeliveryStore.getState().assignments.map((x) =>
        x.orderId === orderId ? { ...x, status: "picked_up" as const } : x
      )
    );
  };

  const pickupStatuses = active.filter((a) => a.status === "assigned" || a.status === "accepted");
  const outForDelivery = active.filter((a) => a.status === "picked_up");
  const initials = (boy?.name ?? "DP").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  if (loadingAssignments) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted" />
        <p className="text-sm text-muted">Loading deliveries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-fresh via-emerald-600 to-brand-blue p-5 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-10 top-12 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold backdrop-blur">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/80">Delivery Partner</p>
            <h1 className="truncate text-xl font-extrabold">{boy?.name ?? "Partner"}</h1>
            {boy?.area && <p className="text-xs text-white/70">{boy.area}</p>}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            On Duty
          </span>
        </div>
      </div>

      <EarningsCard />

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-surface p-3 shadow-sm">
          <p className="text-2xl font-extrabold tabular-nums">{active.length}</p>
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Active</p>
        </div>
        <div className="rounded-2xl border bg-surface p-3 shadow-sm">
          <p className="text-2xl font-extrabold tabular-nums text-brand-blue">{pickupStatuses.length}</p>
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Pickup</p>
        </div>
        <div className="rounded-2xl border bg-surface p-3 shadow-sm">
          <p className="text-2xl font-extrabold tabular-nums text-brand-fresh">{outForDelivery.length}</p>
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">Out for Delivery</p>
        </div>
      </div>

      {/* GPS strip */}
      <div className={`flex items-center justify-between rounded-2xl border p-3.5 shadow-sm transition-all ${tracking ? "border-brand-fresh/30 bg-brand-fresh/5" : "border-brand-red/30 bg-brand-red/5"}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tracking ? "bg-brand-fresh/10" : "bg-brand-red/10"}`}>
            <LocateFixed className={`h-4.5 w-4.5 ${tracking ? "text-brand-fresh" : "text-brand-red"}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Live Tracking</p>
            <p className="text-[10px] text-muted">
              {currentPosition
                ? `${currentPosition[0].toFixed(5)}, ${currentPosition[1].toFixed(5)}`
                : "Waiting for GPS signal while deliveries are active"}
            </p>
          </div>
        </div>
        {tracking ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-fresh bg-brand-fresh/10 px-2.5 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-fresh" />
            </span>
            GPS Live
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full">
            <Radio className="mr-0.5 inline h-3 w-3" /> GPS {gpsError ? "Error" : "Off"}
          </span>
        )}
      </div>
      {gpsError && (
        <p className="text-[10px] text-brand-red bg-brand-red/5 rounded-lg px-3 py-2">{gpsError}</p>
      )}

      {/* Deliveries */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-surface py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <ClipboardList className="h-7 w-7 text-muted" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">No deliveries assigned</p>
          <p className="mt-1 max-w-xs px-4 text-xs text-muted">
            Orders won't appear on their own anymore — the admin assigns deliveries to you directly.
          </p>
        </div>
      ) : (
        <>
          {pickupStatuses.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted uppercase tracking-wide">
                <Package className="h-4 w-4" /> Pickup ({pickupStatuses.length})
              </h3>
              {pickupStatuses.map((a) => (
                <DeliveryCard key={a.id} a={a} currentPosition={currentPosition} customerLocations={customerLocations} onAccept={handleAcceptDelivery} onPickUp={handlePickUp} />
              ))}
            </div>
          )}

          {outForDelivery.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-fresh uppercase tracking-wide">
                <Truck className="h-4 w-4" /> Out for Delivery ({outForDelivery.length})
              </h3>
              {outForDelivery.map((a) => (
                <DeliveryCard key={a.id} a={a} currentPosition={currentPosition} customerLocations={customerLocations} onAccept={handleAcceptDelivery} onPickUp={handlePickUp} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}