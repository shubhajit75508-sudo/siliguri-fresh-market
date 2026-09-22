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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { calcDistance, formatDistance, formatOrderTime } from "@/lib/geo";
import { useOrderStore } from "@/store/order-store";
import { useDeliveryStore } from "@/store/delivery-store";
import dynamic from "next/dynamic";
import type { Order } from "@/types";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), { ssr: false });

const HUB: [number, number] = [26.7319, 88.4256];

type BoyLoc = { lat: number; lng: number; updatedAt: string } | null;

export default function RoutePlannerPage() {
  const { orders, loaded, loadOrders, assignDeliveryBoy } = useOrderStore();
  const { deliveryBoys, deliveryBoysLoaded, loadBoys } = useDeliveryStore();
  const [selectedBoyId, setSelectedBoyId] = useState<string>("");
  const boyLocations = useBoyLocations(deliveryBoys);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loaded, loadOrders]);

  useEffect(() => { loadBoys(); }, [loadBoys]);

  const boy = deliveryBoys.find((b) => b.id === selectedBoyId) ?? null;

  // Candidate unassigned orders (have GPS so they can be routed).
  const candidates = useMemo(() => {
    return orders.filter(
      (o) =>
        !o.deliveryBoyId &&
        o.status !== "delivered" &&
        o.status !== "cancelled" &&
        typeof o.address.lat === "number" &&
        typeof o.address.lng === "number"
    );
  }, [orders]);

  const origin = useMemo<[number, number]>(() => {
    const loc = boyLocations[selectedBoyId];
    if (loc) return [loc.lat, loc.lng];
    return HUB;
  }, [boyLocations, selectedBoyId]);

  const distanceOf = useCallback(
    (o: Order) => {
      if (typeof o.address.lat !== "number" || typeof o.address.lng !== "number") return Infinity;
      return calcDistance(origin[0], origin[1], o.address.lat, o.address.lng);
    },
    [origin]
  );

  const nearest = useMemo(() => {
    if (!selectedBoyId) {
      return [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...candidates].sort((a, b) => distanceOf(a) - distanceOf(b));
  }, [candidates, selectedBoyId, distanceOf]);

  const boyActive = useMemo(() => {
    return orders.filter(
      (o) => o.deliveryBoyId === selectedBoyId && o.deliveryStatus && o.deliveryStatus !== "delivered" && o.deliveryStatus !== "cancelled"
    );
  }, [orders, selectedBoyId]);

  const overLimit = boy
    ? boyActive.length + selectedIds.size > (boy.maxActiveOrders ?? 5)
    : false;

  const selectNearestN = (n: number) => {
    setSelectedIds(new Set(nearest.slice(0, n).map((o) => o.id)));
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        markers.push({ position: [o.address.lat!, o.address.lng!], icon: "active", label: `${o.id} — active` });
      }
    }
    for (const o of nearest) {
      if (typeof o.address.lat !== "number" || typeof o.address.lng !== "number") continue;
      markers.push({
        position: [o.address.lat, o.address.lng],
        icon: selectedIds.has(o.id) ? "active" : "order",
        label: `${o.id} — ${o.customerName} · ${formatDistance(distanceOf(o))}`,
      });
    }
    return markers;
  }, [boy, boyLocations, selectedBoyId, boyActive, nearest, selectedIds, distanceOf]);

  const routePolyline = useMemo(() => {
    if (!selectedBoyId || selectedIds.size === 0) return [];
    const stops = nearest.filter((o) => selectedIds.has(o.id));
    if (stops.length === 0) return [];
    const points: [number, number][] = [HUB];
    const loc = boyLocations[selectedBoyId];
    if (loc) points.push([loc.lat, loc.lng]);
    for (const o of stops) {
      if (typeof o.address.lat === "number" && typeof o.address.lng === "number") {
        points.push([o.address.lat, o.address.lng]);
      }
    }
    return [{ points, color: "#FF7A00", dash: undefined }];
  }, [selectedBoyId, selectedIds, nearest, boyLocations]);

  if (!loaded || !deliveryBoysLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-light" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Route Planner</h2>
          <p className="text-sm text-muted">
            {candidates.length} unassigned with GPS · nearest-first assignment by route
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-fresh" />
          </span>
          {new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
      </div>

      {/* Boy selector */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-3 shadow-sm">
        <Truck className="h-5 w-5 shrink-0 text-brand-blue" />
        <select
          value={selectedBoyId}
          onChange={(e) => {
            setSelectedBoyId(e.target.value);
            setSelectedIds(new Set());
          }}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-dark"
        >
          <option value="">Select a delivery partner…</option>
          {deliveryBoys.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} · {b.area || "Siliguri"} · {b.isActive ? "active" : "inactive"}
            </option>
          ))}
        </select>
        {boy && (
          <>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Package className="h-3.5 w-3.5" /> {boyActive.length}/{boy.maxActiveOrders ?? 5} active
            </span>
            {boyLocations[selectedBoyId] ? (
              <span className="flex items-center gap-1.5 rounded-full bg-brand-fresh/10 px-2.5 py-1 text-[11px] font-semibold text-brand-fresh">
                <Radio className="h-3 w-3" /> GPS Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                <AlertTriangle className="h-3 w-3" /> No GPS — using hub distance
              </span>
            )}
          </>
        )}
      </div>

      {overLimit && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand-red/30 bg-brand-red/5 px-4 py-2.5 text-xs font-semibold text-brand-red">
          <AlertTriangle className="h-4 w-4" /> This will exceed {boy?.name}&apos;s max active orders ({boy?.maxActiveOrders ?? 5}).
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Order list */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">
              {selectedBoyId ? "Nearest orders first" : "Unassigned orders"}
              {selectedBoyId && <span className="ml-1 text-muted">(from {boyLocations[selectedBoyId] ? "boy's live GPS" : "hub"})</span>}
            </h3>
            {selectedBoyId && (
              <div className="ml-auto flex gap-1">
                {[3, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => selectNearestN(n)}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-white/8"
                  >
                    Nearest {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {nearest.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border bg-surface py-12 text-center shadow-sm">
              <Package className="h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-muted-light">No unassigned orders with GPS to route.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
              {nearest.map((o, i) => {
                const d = distanceOf(o);
                return (
                  <OrderRow
                    key={o.id}
                    o={o}
                    rank={selectedBoyId ? i + 1 : undefined}
                    distance={d}
                    checked={selectedIds.has(o.id)}
                    onToggle={() => toggle(o.id)}
                    isAssigned={assigned.has(o.id)}
                  />
                );
              })}
            </div>
          )}

          {selectedBoyId && selectedIds.size > 0 && (
            <Button
              variant="default"
              className="mt-3 w-full"
              disabled={assigning || overLimit}
              onClick={handleAssign}
            >
              {assigning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
              Assign {selectedIds.size} order{selectedIds.size > 1 ? "s" : ""} to {boy?.name}
            </Button>
          )}
        </div>

        {/* Map */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-sm lg:sticky lg:top-4">
          <LiveMap
            center={origin}
            zoom={selectedBoyId ? 13 : 11}
            markers={mapMarkers}
            polylines={routePolyline}
            className="h-[480px] w-full"
          />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            {mapMarkers.length - 1} orders + {boy ? 1 : 0} boy on map
            {selectedIds.size > 0 && <span className="font-bold text-brand-orange"> · {selectedIds.size} routed</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  o,
  rank,
  distance,
  checked,
  onToggle,
  isAssigned,
}: {
  o: Order;
  rank?: number;
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
        <input
          type="checkbox"
          checked={isAssigned || checked}
          disabled={isAssigned}
          onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-brand-dark"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {rank !== undefined && (
              <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue">
                #{rank}
              </span>
            )}
            {isAssigned && <Badge variant="fresh">Assigned ✓</Badge>}
            <p className="font-mono text-xs font-semibold">{o.id}</p>
            <Badge variant={o.paymentMethod === "cod" ? "orange" : "blue"}>
              {o.paymentMethod === "cod" ? "COD" : "UPI"}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium">
            <User className="h-3.5 w-3.5 text-muted" />
            {o.customerName}
            <span className="flex items-center gap-1 text-xs text-muted">
              <Phone className="h-3 w-3" /> {o.customerPhone}
            </span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3" />
            {o.address.area || o.address.line1}
            {o.address.landmark ? ` (near ${o.address.landmark})` : ""} · {o.address.city}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatOrderTime(o.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" /> {o.items.reduce((n, i) => n + i.quantity, 0)} items
            </span>
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