"use client";

import { useMemo, useState, useEffect } from "react";
import { Truck, MapPin, Clock, Package, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const { orders, loaded, loadOrders } = useOrderStore();
  const { assignments, deliveryBoys } = useDeliveryStore();
  const [boyLocations, setBoyLocations] = useState<BoyLocation[]>([]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loaded, loadOrders]);

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
        <div className="flex items-center gap-4 rounded-xl border bg-[#0d1b2a] p-4 shadow-sm">
          <Truck className="h-8 w-8 text-brand-blue" />
          <div>
            <p className="text-xl font-bold">{activeDeliveries.length}</p>
            <p className="text-sm text-[#80949b]">Active Deliveries</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-[#0d1b2a] p-4 shadow-sm">
          <Clock className="h-8 w-8 text-brand-fresh" />
          <div>
            <p className="text-xl font-bold">{avgTime ? `${avgTime} min` : "--"}</p>
            <p className="text-sm text-[#80949b]">Avg Delivery Time</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-[#0d1b2a] p-4 shadow-sm">
          <MapPin className="h-8 w-8 text-brand-purple" />
          <div>
            <p className="text-xl font-bold">{activePartners}</p>
            <p className="text-sm text-[#80949b]">Active Partners</p>
          </div>
        </div>
      </div>

      {/* Partner Locations List */}
      {boyLocations.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-bold">Partner Locations</h3>
          <div className="space-y-2">
            {boyLocations.map((b) => {
              const mins = b.updatedAt ? Math.round((Date.now() - new Date(b.updatedAt).getTime()) / 60000) : null;
              return (
                <div key={b.orderId} className="flex items-center justify-between rounded-xl border bg-[#0d1b2a] p-3 shadow-sm">
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
          <div className="rounded-xl border bg-[#0d1b2a] p-8 text-center shadow-sm">
            <Truck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-[#5a7278]">No deliveries in progress.</p>
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
              <div key={o.id} className="rounded-xl border bg-[#0d1b2a] p-4 shadow-sm">
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
                    {assignment.items.length} items
                    <span className="mx-1">·</span>
                    <Clock className="h-3 w-3" />
                    {timeSinceUpdate || "No GPS"}
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
