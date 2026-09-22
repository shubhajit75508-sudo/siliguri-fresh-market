"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Route,
  MapPin,
  Clock,
  Truck,
  Package,
  Loader2,
  CheckCircle,
  Navigation,
  ShoppingBag,
  AlertTriangle,
  Radio,
  User,
  Phone,
  ListOrdered,
  Info,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { calcDistance, formatDistance, formatOrderTime, timeAgo } from "@/lib/geo";
import { useOrderStore } from "@/store/order-store";
import { useDeliveryStore } from "@/store/delivery-store";
import dynamic from "next/dynamic";
import type { Order } from "@/types";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), { ssr: false });

const HUB: [number, number] = [26.7319, 88.4256];
const AVG_SPEED_KMPH = 20; // rough city-driving estimate for ETA

type BoyLoc = { lat: number; lng: number; updatedAt: string } | null;

export default function RoutePlannerPage() {
  const { orders, loaded, loadOrders, assignDeliveryBoy } = useOrderStore();
  const { deliveryBoys, deliveryBoysLoaded, loadBoys } = useDeliveryStore();
  const [selectedBoyId, setSelectedBoyId] = useState<string>("");
  const boyLocations = useBoyLocations(deliveryBoys);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [showNoGps, setShowNoGps] = useState(true);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loaded, loadOrders]);

  useEffect(() => { loadBoys(); }, [loadBoys]);

  const boy = deliveryBoys.find((b) => b.id === selectedBoyId) ?? null;

  // Unassigned active orders, split by whether they have a location to route.
  const unassigned = useMemo(
    () =>
      orders.filter(
        (o) => !o.deliveryBoyId && o.status !== "delivered" && o.status !== "cancelled"
      ),
    [orders]
  );

  const candidates = useMemo(
    () =>
      unassigned.filter(
        (o) => typeof o.address.lat === "number" && typeof o.address.lng === "number"
      ),
    [unassigned]
  );

  const noGps = useMemo(
    () => unassigned.filter((o) => typeof o.address.lat !== "number" || typeof o.address.lng !== "number"),
    [unassigned]
  );

  const origin = useMemo<[number, number]>(() => {
    const loc = boyLocations[selectedBoyId];
    return loc ? [loc.lat, loc.lng] : HUB;
  }, [boyLocations, selectedBoyId]);

  const distanceOf = useCallback(
    (o: Order) => {
      if (typeof o.address.lat !== "number" || typeof o.address.lng !== "number") return Infinity;
      return calcDistance(origin[0], origin[1], o.address.lat, o.address.lng);
    },
    [origin]
  );

  // When a boy is selected, order candidates nearest-first. Otherwise just by newest.
  const nearest = useMemo(() => {
    if (!selectedBoyId) {
      return [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...candidates].sort((a, b) => distanceOf(a) - distanceOf(b));
  }, [candidates, selectedBoyId, distanceOf]);

  const boyActive = useMemo(
    () =>
      orders.filter(
        (o) => o.deliveryBoyId === selectedBoyId && o.deliveryStatus && o.deliveryStatus !== "delivered" && o.deliveryStatus !== "cancelled"
      ),
    [orders, selectedBoyId]
  );

  const overLimit = boy ? boyActive.length + selectedIds.size > (boy.maxActiveOrders ?? 5) : false;

  const selectNearestN = (n: number) => setSelectedIds(new Set(nearest.slice(0, n).map((o) => o.id)));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Ordered stops = selected candidates in route order (nearest-first).
  const stops = useMemo(
    () => (selectedBoyId ? nearest.filter((o) => selectedIds.has(o.id)) : []),
    [nearest, selectedIds, selectedBoyId]
  );

  // Route leg distances + totals (origin → stop1 → stop2 → …)
  const routeStats = useMemo(() => {
    if (stops.length === 0) return null;
    const points: { pos: [number, number] }[] = [{ pos: origin }];
    for (const o of stops) points.push({ pos: [o.address.lat!, o.address.lng!] });
    let totalKm = 0;
    const legs: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const d = calcDistance(points[i - 1].pos[0], points[i - 1].pos[1], points[i].pos[0], points[i].pos[1]);
      legs.push(d);
      totalKm += d;
    }
    const minutes = Math.max(3, Math.round((totalKm / AVG_SPEED_KMPH) * 60));
    return { totalKm, legs, minutes };
  }, [stops, origin]);

  const handleAssign = async () => {
    if (!boy || selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const store = useDeliveryStore.getState();
      const newly: string[] = [];
      for (const orderId of selectedIds) {
        try {
          const result = await assignDeliveryBoy(orderId, boy.id, boy.name, boy.email);
          if (result?.assignment) {
            store.setAssignments([...store.assignments, result.assignment]);
            newly.push(orderId);
          }
        } catch {
          // best-effort per order
        }
      }
      setAssigned(new Set(newly));
      setSelectedIds(new Set());
      await loadOrders();
    } finally {
      setAssigning(false);
      setTimeout(() => setAssigned(new Set()), 4000);
    }
  };

  const mapMarkers = useMemo(() => {
    const markers: { position: [number, number]; icon: "boy" | "customer" | "store" | "order" | "active"; label?: string }[] = [
      { position: HUB, icon: "store", label: "Hub — NJP Gate Bazar" },
    ];
    const loc = boyLocations[selectedBoyId];
    if (boy && loc) {
      markers.push({ position: [loc.lat, loc.lng], icon: "boy", label: `${boy.name} (live GPS)` });
    }
    for (const o of boyActive) {
      if (typeof o.address.lat === "number" && typeof o.address.lng === "number") {
        markers.push({ position: [o.address.lat!, o.address.lng!], icon: "active", label: `${o.id} — already assigned` });
      }
    }
    for (const o of nearest) {
      if (typeof o.address.lat !== "number" || typeof o.address.lng !== "number") continue;
      const idx = stops.findIndex((s) => s.id === o.id);
      markers.push({
        position: [o.address.lat, o.address.lng],
        icon: selectedIds.has(o.id) ? "active" : "order",
        label: `${idx >= 0 ? `Stop ${idx + 1} — ` : ""}${o.id}`,
      });
    }
    return markers;
  }, [boy, boyLocations, selectedBoyId, boyActive, nearest, selectedIds, stops]);

  const routePolyline = useMemo(() => {
    if (stops.length === 0) return [];
    const points: [number, number][] = [origin];
    for (const o of stops) points.push([o.address.lat!, o.address.lng!]);
    return [{ points, color: "#FF7A00" }];
  }, [stops, origin]);

  if (!loaded || !deliveryBoysLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-light" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Route Planner</h2>
          <p className="text-sm text-muted">Group unassigned orders into a delivery route, nearest stop first.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-fresh" />
          </span>
          {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
        </div>
      </div>

      {/* How it works */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-xs font-medium text-foreground">
        <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">1</span> Pick a delivery partner</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted" />
        <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">2</span> Tick the orders to deliver</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted" />
        <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">3</span> Assign route</span>
      </div>

      {/* Stats */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/8 px-3 py-1 font-semibold">{unassigned.length} unassigned</span>
        <span className="rounded-full bg-brand-blue/10 px-3 py-1 font-semibold text-brand-blue">{candidates.length} ready to route</span>
        {noGps.length > 0 && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 font-semibold text-amber-600">{noGps.length} need a location</span>
        )}
      </div>

      {/* Step 1: boy selector */}
      <div className="mt-4 rounded-xl border bg-surface p-3 shadow-sm">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <Truck className="h-3.5 w-3.5" /> 1 · Delivery partner
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBoyId}
            onChange={(e) => { setSelectedBoyId(e.target.value); setSelectedIds(new Set()); }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-dark"
          >
            <option value="">Select a delivery partner…</option>
            {deliveryBoys.map((b) => (
              <option key={b.id} value={b.id}>{b.name} · {b.area || "Siliguri"} · {b.isActive ? "active" : "inactive"}</option>
            ))}
          </select>
          {boy && (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Package className="h-3.5 w-3.5" /> {boyActive.length}/{boy.maxActiveOrders ?? 5} active
              </span>
              {boyLocations[selectedBoyId] ? (
                <span className="flex items-center gap-1.5 rounded-full bg-brand-fresh/10 px-2.5 py-1 text-[11px] font-semibold text-brand-fresh">
                  <Radio className="h-3 w-3" /> GPS Live · {timeAgo(boyLocations[selectedBoyId]?.updatedAt)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                  <AlertTriangle className="h-3 w-3" /> No GPS — distances from hub
                </span>
              )}
            </>
          )}
        </div>
        {!selectedBoyId && (
          <p className="mt-2 text-[11px] text-muted">Tip: pick a partner first so orders sort by nearest distance from their live location.</p>
        )}
      </div>

      {overLimit && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand-red/30 bg-brand-red/5 px-4 py-2.5 text-xs font-semibold text-brand-red">
          <AlertTriangle className="h-4 w-4" /> This will exceed {boy?.name}&apos;s max active orders ({boy?.maxActiveOrders ?? 5}). Un-tick some orders or finish existing ones.
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Step 2: order list */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ListOrdered className="h-4 w-4 text-muted" /> 2 · Select orders
            </h3>
            {selectedBoyId ? (
              <span className="text-xs text-muted">nearest first from {boyLocations[selectedBoyId] ? "live GPS" : "hub"}</span>
            ) : (
              <span className="text-xs text-muted">newest first</span>
            )}
            {selectedBoyId && (
              <div className="ml-auto flex gap-1">
                <button onClick={() => setSelectedIds(new Set(nearest.map((o) => o.id)))} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-white/8">All</button>
                {[3, 5].map((n) => (
                  <button key={n} onClick={() => selectNearestN(n)} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-white/8">Nearest {n}</button>
                ))}
                {selectedIds.size > 0 && (
                  <button onClick={() => setSelectedIds(new Set())} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-brand-red hover:bg-white/8">Clear</button>
                )}
              </div>
            )}
          </div>

          {nearest.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border bg-surface py-12 text-center shadow-sm">
              <Package className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-muted-light">No unassigned orders ready to route.</p>
              <p className="mt-1 text-xs text-muted">New orders appear here automatically.</p>
            </div>
          ) : (
            <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {nearest.map((o) => {
                const d = distanceOf(o);
                const stopIdx = stops.findIndex((s) => s.id === o.id);
                return (
                  <OrderRow
                    key={o.id}
                    o={o}
                    stopNumber={stopIdx >= 0 ? stopIdx + 1 : undefined}
                    distance={d}
                    checked={selectedIds.has(o.id)}
                    onToggle={() => toggle(o.id)}
                    isAssigned={assigned.has(o.id)}
                  />
                );
              })}
            </div>
          )}

          {/* Step 3: assign */}
          {selectedBoyId && selectedIds.size > 0 && (
            <div className="mt-3">
              <Button variant="default" className="w-full" disabled={assigning || overLimit} onClick={handleAssign}>
                {assigning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                3 · Assign {selectedIds.size} order{selectedIds.size > 1 ? "s" : ""} to {boy?.name}
              </Button>
              {routeStats && (
                <p className="mt-2 text-center text-[11px] text-muted">
                  Route: {formatDistance(routeStats.totalKm)} total · ~{routeStats.minutes} min driving
                </p>
              )}
            </div>
          )}
        </div>

        {/* Map + route summary */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-sm lg:sticky lg:top-4">
            <LiveMap center={origin} zoom={selectedBoyId ? 13 : 11} markers={mapMarkers} polylines={routePolyline} className="h-[380px] w-full" />
            <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              {mapMarkers.length - 1} on map{stops.length > 0 && <span className="font-bold text-brand-orange"> · {stops.length} stop{stops.length > 1 ? "s" : ""} routed</span>}
            </div>
          </div>

          {/* Route summary */}
          {stops.length > 0 && routeStats && (
            <div className="rounded-xl border border-border bg-surface p-3 text-sm shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Route preview (≈ {formatDistance(routeStats.totalKm)} · {routeStats.minutes} min)</p>
              <ol className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs text-muted">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold">0</span>
                  Start — {boyLocations[selectedBoyId] ? (boy?.name ?? "Partner") : "Hub (NJP Gate Bazar)"}
                </li>
                {stops.map((o, i) => (
                  <li key={o.id} className="flex items-center gap-2 text-xs">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{o.customerName} · {o.address.area || o.address.line1}</span>
                    <span className="shrink-0 text-muted">{formatDistance(routeStats.legs[i])}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* No-GPS orders */}
          {noGps.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
              <button onClick={() => setShowNoGps((v) => !v)} className="flex w-full items-center justify-between text-left">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Info className="h-3.5 w-3.5 text-amber-500" /> {noGps.length} order{noGps.length > 1 ? "s" : ""} missing a location
                </span>
                <span className="text-xs text-muted">{showNoGps ? "Hide" : "Show"}</span>
              </button>
              <p className="mt-1 text-[11px] text-muted">These can&apos;t be placed on the map until a delivery address/pin is set.</p>
              {showNoGps && (
                <div className="mt-2 space-y-1.5">
                  {noGps.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                      <span className="min-w-0 truncate">{o.id} · {o.customerName} · {o.address.line1 || "no address"}</span>
                      <a href={`/admin/orders?q=${encodeURIComponent(o.id)}`} className="shrink-0 font-semibold text-brand-blue hover:underline">Edit</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  o,
  stopNumber,
  distance,
  checked,
  onToggle,
  isAssigned,
}: {
  o: Order;
  stopNumber?: number;
  distance: number;
  checked: boolean;
  onToggle: () => void;
  isAssigned: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-surface p-3 shadow-sm transition-all ${
        checked ? "border-brand-orange ring-1 ring-brand-orange/40" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {stopNumber !== undefined ? (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
            {stopNumber}
          </span>
        ) : (
          <input
            type="checkbox"
            checked={isAssigned || checked}
            disabled={isAssigned}
            onChange={onToggle}
            className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-brand-dark"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isAssigned && <Badge variant="fresh">Assigned ✓</Badge>}
            <p className="font-mono text-xs font-semibold">{o.id}</p>
            <Badge variant={o.paymentMethod === "cod" ? "orange" : "blue"}>{o.paymentMethod === "cod" ? "COD" : "UPI"}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium">
            <User className="h-3.5 w-3.5 text-muted" /> {o.customerName}
            <span className="flex items-center gap-1 text-xs text-muted"><Phone className="h-3 w-3" /> {o.customerPhone}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3" /> {o.address.area || o.address.line1}
            {o.address.landmark ? ` (near ${o.address.landmark})` : ""} · {o.address.city}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatOrderTime(o.createdAt)}</span>
            <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {o.items.reduce((n, i) => n + i.quantity, 0)} items</span>
            <span className="font-bold text-foreground">{formatPrice(o.total)}</span>
            {Number.isFinite(distance) && (
              <span className="rounded bg-white/40 px-1.5 py-0.5 font-semibold text-brand-blue">
                {formatDistance(distance)} away
              </span>
            )}
            {typeof o.address.lat === "number" && typeof o.address.lng === "number" && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${o.address.lat},${o.address.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand-blue hover:underline"
              >
                <Navigation className="h-3 w-3" /> Navigate
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function useBoyLocations(boys: { id: string }[]) {
  const [loc, setLoc] = useState<Record<string, BoyLoc>>({});

  useEffect(() => {
    for (const b of boys) {
      fetch(`/api/delivery/location?boy_id=${encodeURIComponent(b.id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.location) {
            setLoc((prev) => ({
              ...prev,
              [b.id]: { lat: json.location.lat, lng: json.location.lng, updatedAt: json.location.updated_at },
            }));
          }
        })
        .catch(() => {});
    }
  }, [boys]);

  return loc;
}