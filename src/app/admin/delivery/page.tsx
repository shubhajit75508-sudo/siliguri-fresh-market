"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Truck, MapPin, Clock, Package, Navigation, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useOrderStore } from "@/store/order-store";
import { useDeliveryStore } from "@/store/delivery-store";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), { ssr: false });

interface BoyLocation {
  boyId: string;
  boyName: string;
  orderId: string;
  lat: number;
  lng: number;
  updatedAt: string;
}

export default function DeliveryPage() {
  const { orders, loaded, loadOrders, confirmDelivery } = useOrderStore();
  const { assignments, deliveryBoys, loadBoys } = useDeliveryStore();
  const [boyLocations, setBoyLocations] = useState<BoyLocation[]>([]);
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loaded, loadOrders]);

  useEffect(() => {
    loadBoys();
  }, [loadBoys]);

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

  const boyNameFor = useCallback(
    (boyId?: string | null) => {
      if (!boyId) return "Unassigned";
      return deliveryBoys.find((b) => b.id === boyId)?.name ?? "Partner";
    },
    [deliveryBoys]
  );

  const boyStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekDay = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekDay).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return deliveryBoys
      .map((boy) => {
        const boyOrders = orders.filter((o) => o.deliveryBoyId === boy.id);
        const delivered = boyOrders.filter((o) => o.status === "delivered");
        const cancelled = boyOrders.filter((o) => o.status === "cancelled");
        const codDelivered = delivered.filter((o) => o.paymentMethod === "cod");
        const collected = codDelivered.reduce((sum, o) => sum + o.total, 0);
        const inPeriod = (start: number) =>
          codDelivered
            .filter((o) => Number.isFinite(new Date(o.createdAt).getTime()) && new Date(o.createdAt).getTime() >= start)
            .reduce((sum, o) => sum + o.total, 0);
        return {
          boy,
          assigned: boyOrders.length,
          delivered: delivered.length,
          cancelled: cancelled.length,
          collected,
          todayCollected: inPeriod(startOfToday),
          weekCollected: inPeriod(startOfWeek),
          monthCollected: inPeriod(startOfMonth),
        };
      })
      .filter((s) => s.assigned > 0)
      .sort((a, b) => b.delivered - a.delivered);
  }, [deliveryBoys, orders]);

  const totalStats = boyStats.reduce(
    (acc, s) => ({
      assigned: acc.assigned + s.assigned,
      delivered: acc.delivered + s.delivered,
      cancelled: acc.cancelled + s.cancelled,
      collected: acc.collected + s.collected,
      todayCollected: acc.todayCollected + s.todayCollected,
      weekCollected: acc.weekCollected + s.weekCollected,
      monthCollected: acc.monthCollected + s.monthCollected,
    }),
    { assigned: 0, delivered: 0, cancelled: 0, collected: 0, todayCollected: 0, weekCollected: 0, monthCollected: 0 }
  );

  useEffect(() => {
    if (activeDeliveries.length === 0) return;

    const orderIds = activeDeliveries.map((o) => o.id);

    const fetchLocations = () => {
      orderIds.forEach((orderId) => {
        fetch(`/api/delivery/location?order_id=${orderId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((json) => {
            if (json?.location) {
              setBoyLocations((prev) => {
                const existing = prev.findIndex((b) => b.orderId === orderId);
                const entry: BoyLocation = {
                  boyId: json.location.delivery_boy_id,
                  boyName: deliveryBoys.find((b) => b.id === json.location.delivery_boy_id)?.name ?? "Partner",
                  orderId,
                  lat: json.location.lat,
                  lng: json.location.lng,
                  updatedAt: json.location.updated_at,
                };
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = entry;
                  return updated;
                }
                return [...prev, entry];
              });
            }
          })
          .catch(() => {});
      });
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 15000);
    return () => clearInterval(interval);
  }, [activeDeliveries.length, deliveryBoys]);

  const handleMarkDelivered = async (orderId: string) => {
    setMarkingDelivered(orderId);
    try {
      await confirmDelivery(orderId);
      await loadOrders();
    } catch (e) {
      console.error("Mark delivered failed:", e);
    } finally {
      setMarkingDelivered(null);
    }
  };

  const mapMarkers = boyLocations.map((b) => ({
    position: [b.lat, b.lng] as [number, number],
    icon: "boy" as const,
    label: `${b.boyName} — ${b.orderId}`,
  }));

  const mapCenter: [number, number] = boyLocations.length > 0
    ? [boyLocations[0].lat, boyLocations[0].lng]
    : [26.7319, 88.4256];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Delivery Tracking</h2>
          <p className="text-sm text-muted">{activeDeliveries.length} active · {boyLocations.length} with GPS</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-fresh" />
          </span>
          <span className="text-xs text-muted">Live</span>
        </div>
      </div>

      {/* Live Map */}
      {boyLocations.length > 0 && (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
          <LiveMap
            center={mapCenter}
            markers={mapMarkers}
            className="h-80 w-full"
          />
          <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            {boyLocations.length} partner{boyLocations.length > 1 ? "s" : ""} on map
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border bg-surface p-4 shadow-sm">
          <Truck className="h-8 w-8 text-brand-blue" />
          <div>
            <p className="text-xl font-bold">{activeDeliveries.length}</p>
            <p className="text-sm text-muted">Active Deliveries</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-surface p-4 shadow-sm">
          <Clock className="h-8 w-8 text-brand-fresh" />
          <div>
            <p className="text-xl font-bold">{avgTime ? `${avgTime} min` : "--"}</p>
            <p className="text-sm text-muted">Avg Delivery Time</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-surface p-4 shadow-sm">
          <MapPin className="h-8 w-8 text-brand-purple" />
          <div>
            <p className="text-xl font-bold">{activePartners}</p>
            <p className="text-sm text-muted">Active Partners</p>
          </div>
        </div>
      </div>

      {/* Partners Performance */}
      <div className="mt-6">
        <h3 className="mb-3 font-bold">Partners Performance</h3>
        {boyStats.length === 0 ? (
          <div className="rounded-xl border bg-surface p-8 text-center shadow-sm">
            <Truck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted-light">No deliveries assigned to any partner yet.</p>
          </div>
        ) : (
          <>
            {/* Period totals */}
            <div className="mb-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-surface p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Collected Today</p>
                <p className="text-lg font-extrabold tabular-nums text-brand-fresh">{formatPrice(totalStats.todayCollected)}</p>
              </div>
              <div className="rounded-xl border bg-surface p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">This Week</p>
                <p className="text-lg font-extrabold tabular-nums text-brand-blue">{formatPrice(totalStats.weekCollected)}</p>
              </div>
              <div className="rounded-xl border bg-surface p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">This Month</p>
                <p className="text-lg font-extrabold tabular-nums">{formatPrice(totalStats.monthCollected)}</p>
              </div>
            </div>

            {/* Per-partner cards */}
            <div className="space-y-3">
              {boyStats.map((s) => (
                <div key={s.boy.id} className="rounded-xl border bg-surface p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-fresh/10 text-xs font-bold text-brand-fresh">
                        {(s.boy.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{s.boy.name}</p>
                        <p className="text-[10px] text-muted">{s.boy.area || "Siliguri"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
                      <span className="text-muted"><Package className="mr-1 inline h-3.5 w-3.5" />{s.assigned} assigned</span>
                      <span className="font-semibold text-brand-fresh"><CheckCircle className="mr-1 inline h-3.5 w-3.5" />{s.delivered} delivered</span>
                      <span className="font-semibold text-brand-red"><XCircle className="mr-1 inline h-3.5 w-3.5" />{s.cancelled} cancelled</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white/40 p-2.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Today</p>
                      <p className="text-sm font-bold tabular-nums text-brand-fresh">{formatPrice(s.todayCollected)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Week</p>
                      <p className="text-sm font-bold tabular-nums text-brand-blue">{formatPrice(s.weekCollected)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Month</p>
                      <p className="text-sm font-bold tabular-nums">{formatPrice(s.monthCollected)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-right text-[10px] text-muted">All-time collected: {formatPrice(s.collected)}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted">
              Collected amounts are COD order values on delivered orders. Counts reflect only orders closed by admin/manager confirmation.
            </p>
          </>
        )}
      </div>

      {/* Partner Locations List */}
      {boyLocations.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-bold">Partner Locations</h3>
          <div className="space-y-2">
            {boyLocations.map((b) => {
              const mins = b.updatedAt ? Math.round((Date.now() - new Date(b.updatedAt).getTime()) / 60000) : null;
              return (
                <div key={b.orderId} className="flex items-center justify-between rounded-xl border bg-surface p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium">{b.boyName}</p>
                    <p className="text-xs text-muted">{b.orderId}</p>
                    {mins !== null && (
                      <p className="text-[10px] text-muted/60 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Updated {mins < 1 ? "just now" : `${mins} min ago`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <MapPin className="h-3 w-3" />
                    {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                    <a
                      href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-brand-blue hover:underline"
                    >
                      <Navigation className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {mins !== null && mins > 5 && (
                      <span className="h-2 w-2 rounded-full bg-amber-400" title="Stale GPS" />
                    )}
                    <Badge variant="fresh">Live</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="font-bold">Current Deliveries</h3>
        {activeDeliveries.length === 0 ? (
          <div className="rounded-xl border bg-surface p-8 text-center shadow-sm">
            <Truck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-muted-light">No deliveries in progress.</p>
          </div>
        ) : (
          activeDeliveries.map((o) => {
            const assignment = assignments.find((a) => a.orderId === o.id);
            const location = boyLocations.find((b) => b.orderId === o.id);
            let etaText = "";
            let distanceText = "";
            let timeSinceUpdate = "";
            if (location && o.address.lat && o.address.lng) {
              const d = calcDistance(location.lat, location.lng, o.address.lat, o.address.lng);
              distanceText = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
              const speed = 20;
              const etaH = d / speed;
              etaText = etaH > 0.1 ? `${Math.round(etaH * 60)} min` : "Arriving";
              if (location.updatedAt) {
                const mins = Math.round((Date.now() - new Date(location.updatedAt).getTime()) / 60000);
                timeSinceUpdate = mins < 1 ? "Just now" : `${mins} min ago`;
              }
            }
            return (
              <div key={o.id} className="rounded-xl border bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{o.id}</p>
                      <Badge variant={o.deliveryStatus === "assigned" ? "blue" : o.deliveryStatus === "accepted" ? "orange" : "fresh"}>
                        {o.deliveryStatus?.replace(/_/g, " ") ?? "Pending"}
                      </Badge>
                      {etaText && (
                        <Badge variant="blue" className="text-[10px]">
                          <Clock className="mr-0.5 h-3 w-3" /> ETA {etaText}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{o.customerName} · {o.customerPhone}</p>
                    <p className="mt-1 text-xs text-brand-blue flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Assigned: {boyNameFor(o.deliveryBoyId)}
                    </p>
                    {location && (
                      <p className="mt-1 text-xs text-brand-fresh flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {location.boyName} — {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(o.total)}</p>
                    {distanceText && (
                      <p className="text-[10px] text-muted mt-0.5">{distanceText} away</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <MapPin className="h-3 w-3" />
                  {o.address.line1}, {o.address.city} — {o.address.pincode}
                </div>
                {assignment && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Package className="h-3 w-3" />
                    {assignment.items.length} item{assignment.items.length > 1 ? "s" : ""} · {o.items.length} product{o.items.length > 1 ? "s" : ""}
                    <span className="mx-1">·</span>
                    <Clock className="h-3 w-3" />
                    {timeSinceUpdate || "No GPS"}
                  </div>
                )}
                {o.deliveryStatus === "picked_up" && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="fresh"
                      size="sm"
                      disabled={markingDelivered === o.id}
                      onClick={() => handleMarkDelivered(o.id)}
                      className="bg-brand-fresh hover:bg-brand-fresh/90"
                    >
                      {markingDelivered === o.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1 h-3.5 w-3.5" />}
                      Mark Delivered
                    </Button>
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

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
