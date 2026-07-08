"use client";

import { useDeliveryStore } from "@/store/delivery-store";
import { useOrderStore } from "@/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import LiveMap from "@/components/maps/LiveMap";
import type { DeliveryAssignment, Order } from "@/types";
import {
  Navigation, MapPin, Phone, Package, CheckCircle, Truck, ShoppingBag, Radio, Loader2, KeyRound, LocateFixed,
  XCircle, Clock, AlertTriangle,
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

function ageBadgeColor(min: number): string {
  if (min < 15) return "text-brand-fresh bg-brand-fresh/10";
  if (min < 30) return "text-brand-orange bg-brand-orange/10";
  return "text-brand-red bg-brand-red/10";
}

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

// ── Available Order Card ─────────────────────────────

function AvailableCard({
  order, boyId, atCapacity, onAccept, onReject, accepting, rejecting,
}: {
  order: Order; boyId: string; atCapacity: boolean;
  onAccept: (id: string) => void; onReject: (id: string) => void;
  accepting: string | null; rejecting: string | null;
}) {
  const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  return (
    <div className="mb-3 rounded-2xl border border-brand-fresh/20 bg-surface p-4 shadow-sm hover:border-brand-fresh/40 transition-all">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground truncate">{order.customerName}</p>
            <Badge variant={order.paymentMethod === "razorpay" ? "fresh" : "orange"}>
              {order.paymentMethod === "razorpay" ? "Paid" : "COD"}
            </Badge>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ageBadgeColor(mins)}`}>
              <Clock className="h-3 w-3" /> {mins < 1 ? "<1 min" : `${mins} min`}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted">{order.customerPhone}</p>
          <p className="text-[10px] font-mono text-muted mt-0.5">{order.id}</p>
        </div>
        <p className="shrink-0 text-sm font-bold text-foreground">{formatPrice(order.total)}</p>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm space-y-1">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <div className="text-xs">
            <p className="font-medium text-foreground">{order.address.line1}</p>
            {order.address.area && <p className="text-muted">Area: {order.address.area}</p>}
            {order.address.landmark && <p className="text-muted">Near: {order.address.landmark}</p>}
            {order.address.building && <p className="text-muted">{order.address.building}{order.address.flat ? `, Flat ${order.address.flat}` : ""}{order.address.floor ? `, Floor ${order.address.floor}` : ""}</p>}
            <p className="text-muted">{order.address.city} — {order.address.pincode}</p>
          </div>
        </div>
      </div>

      <details className="mt-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted">
          <ShoppingBag className="h-3.5 w-3.5" /> {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </summary>
        <ul className="mt-2 space-y-1.5 pl-5">
          {order.items.map((item, i) => (
            <li key={i} className="text-sm text-muted flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{item.product.name}</span>
              <span className="text-muted-light">×{item.quantity}</span>
              {item.selectedWeight && <Badge variant="fresh" className="text-[10px]">{item.selectedWeight}</Badge>}
              {item.selectedCut && <Badge variant="blue" className="text-[10px]">{item.selectedCut}</Badge>}
              {item.selectedCleaning && <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7C3AED]">{item.selectedCleaning}</span>}
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3">
        <a
          href={`tel:${order.customerPhone}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-muted hover:bg-white/5"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        {atCapacity && (
          <span className="text-[10px] text-brand-orange flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Queue full
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" disabled={rejecting === order.id}
            onClick={() => onReject(order.id)}
            className="border-brand-red/30 text-brand-red hover:bg-brand-red/5"
          >
            {rejecting === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Reject
          </Button>
          <Button variant="fresh" size="sm" disabled={accepting === order.id || atCapacity}
            onClick={() => onAccept(order.id)}
            className="bg-brand-fresh hover:bg-brand-fresh/90"
          >
            {accepting === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Delivery Card (existing) ─────────────────────────

function DeliveryCard({
  a, deliveryCodes, setDeliveryCodes, codeError, setCodeError,
  currentPosition, customerLocations,
  onAccept, onPickUp, onConfirm,
}: {
  a: DeliveryAssignment;
  deliveryCodes: Record<string, string>;
  setDeliveryCodes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  codeError: string | null;
  setCodeError: React.Dispatch<React.SetStateAction<string | null>>;
  currentPosition: [number, number] | null;
  customerLocations: Record<string, [number, number]>;
  onAccept: (orderId: string) => void;
  onPickUp: (orderId: string) => void;
  onConfirm: (orderId: string, code: string) => Promise<void>;
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
        <ul className="mt-2 space-y-1 pl-5 text-sm text-muted">
          {a.items.map((item, i) => (
            <li key={i}>{item.name} × {item.quantity}</li>
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
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-muted" />
                <input
                  type="tel"
                  maxLength={4}
                  placeholder="Enter 4-digit code"
                  value={deliveryCodes[a.orderId] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setDeliveryCodes((prev) => ({ ...prev, [a.orderId]: val }));
                    setCodeError(null);
                  }}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base text-center tracking-[0.3em] font-bold text-foreground placeholder:text-muted/50 outline-none focus:border-brand-fresh/50 focus:ring-2 focus:ring-brand-fresh/20"
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
                  try { await onConfirm(a.orderId, enteredCode); }
                  catch { setCodeError("Invalid code. Try again."); }
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

// ── Map raw DB order to Order type ───────────────────

function mapDbOrder(r: Record<string, unknown>): Order {
  return {
    id: r.id as string,
    items: (r.items as Order["items"]) ?? [],
    status: (r.status as Order["status"]) ?? "received",
    total: Number(r.total),
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
    address: (r.address_snapshot as Order["address"]) ?? { id: "", label: "", line1: "", city: "", pincode: "", isDefault: false },
    eta: 30,
    customerName: (r.customer_name as string) ?? "",
    customerPhone: (r.customer_phone as string) ?? "",
    customerEmail: (r.customer_email as string) ?? "",
    paymentMethod: (r.payment_method as string) ?? "cod",
    paymentStatus: (r.payment_status as "paid" | "unpaid") ?? "unpaid",
    deliveryStatus: (r.delivery_status as import("@/types").DeliveryStatus) ?? "pending",
    deliveryBoyId: r.delivery_boy_id as string | undefined,
    deliveryBoyName: r.delivery_boy_name as string | undefined,
    returnRequested: Boolean(r.return_requested),
    returnApproved: Boolean(r.return_approved),
    deliveryCode: (r.delivery_code as string) ?? "",
  };
}

// ── Main Dashboard ───────────────────────────────────

export default function DeliveryDashboard() {
  const { boy, assignments, confirmDelivery: deliveryConfirm } = useDeliveryStore();
  const { acceptDelivery, pickUpDelivery, confirmDelivery } = useOrderStore();

  // Available orders state
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [atCapacity, setAtCapacity] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [tab, setTab] = useState<"available" | "my">("available");

  // Existing state
  const [tracking, setTracking] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef<number | null>(null);
  const [deliveryCodes, setDeliveryCodes] = useState<Record<string, string>>({});
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [customerLocations, setCustomerLocations] = useState<Record<string, [number, number]>>({});

  const active = useMemo(() => assignments.filter((a) => a.deliveryBoyId === boy?.id && a.status !== "delivered"), [assignments, boy?.id]);
  const activeOrderIds = useMemo(() => active.map((a) => a.orderId), [active]);
  const prevAvailableCountRef = useRef(0);

  // ── Fetch available orders ──
  const fetchAvailable = useCallback(async () => {
    const currentBoy = useDeliveryStore.getState().boy;
    if (!currentBoy) return;
    try {
      const res = await fetch(`/api/delivery/available?boy_id=${encodeURIComponent(currentBoy.id)}`);
      if (!res.ok) return;
      const json = await res.json();
      const orders: Order[] = (json.orders ?? []).map(mapDbOrder);
      if (orders.length > prevAvailableCountRef.current && prevAvailableCountRef.current > 0) {
        playNewOrderSound();
      }
      prevAvailableCountRef.current = orders.length;
      setAvailableOrders(orders);
      setAtCapacity(json.atCapacity ?? false);
    } catch {}
  }, []);

  // ── Subscribe to boy changes + poll ──
  useEffect(() => {
    const doFetch = async () => {
      const b = useDeliveryStore.getState().boy;
      if (!b) return;
      try {
        const res = await fetch(`/api/delivery/available?boy_id=${encodeURIComponent(b.id)}`);
        if (!res.ok) return;
        const json = await res.json();
        const orders: Order[] = (json.orders ?? []).map(mapDbOrder);
        if (orders.length > prevAvailableCountRef.current && prevAvailableCountRef.current > 0) {
          playNewOrderSound();
        }
        prevAvailableCountRef.current = orders.length;
        setAvailableOrders(orders);
        setAtCapacity(json.atCapacity ?? false);
      } catch {}
    };
    doFetch();
    const interval = setInterval(doFetch, 10000);
    const unsub = useDeliveryStore.subscribe((s) => { if ((s as any).boy) doFetch(); });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  // ── Accept / Reject handlers ──
  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    try {
      const res = await fetch("/api/delivery/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error("Already taken");
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      useDeliveryStore.getState().loadAssignments();
    } catch {}
    finally { setAccepting(null); }
  };

  const handleReject = async (orderId: string) => {
    setRejecting(orderId);
    try {
      const res = await fetch("/api/delivery/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) { const err = await res.text(); console.error("Reject failed:", err); return; }
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) { console.error("Reject error:", e); }
    finally { setRejecting(null); }
  };

  // ── Existing handlers ──
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
    const b = useDeliveryStore.getState().boy;
    if (b) {
      useDeliveryStore.getState().loadAssignments().finally(() => setLoadingAssignments(false));
    } else {
      setLoadingAssignments(false);
    }
  }, []);

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

  const handleConfirm = async (orderId: string, code: string) => {
    const prevOrders = useOrderStore.getState().orders;
    try {
      await confirmDelivery(orderId, code);
      deliveryConfirm(assignments.find((x) => x.orderId === orderId)?.id || "");
      setDeliveryCodes((prev) => ({ ...prev, [orderId]: "" }));
      setCodeError(null);
    } catch (e) {
      useOrderStore.setState({ orders: prevOrders });
      setCodeError(e instanceof Error ? e.message : "Invalid code. Try again.");
    }
  };

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

  return (
    <div className="space-y-4 pb-8">
      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1">
        <button
          onClick={() => setTab("available")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "available" ? "bg-brand-dark text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Available ({availableOrders.length})
        </button>
        <button
          onClick={() => setTab("my")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "my" ? "bg-brand-dark text-white" : "text-muted hover:text-foreground"
          }`}
        >
          My Deliveries ({active.length})
        </button>
      </div>

      {tab === "available" ? (
        availableOrders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-muted" />
            <p className="text-sm font-bold text-foreground">No orders available</p>
            <p className="mt-1 text-xs text-muted">New orders will appear here automatically</p>
          </div>
        ) : (
          <div>
            {atCapacity && (
              <div className="mb-3 rounded-xl bg-brand-orange/10 px-4 py-2.5 text-xs text-brand-orange flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                You've reached your active delivery limit. Complete a delivery to accept new orders.
              </div>
            )}
            {availableOrders.map((o) => (
              <AvailableCard
                key={o.id}
                order={o}
                boyId={boy!.id}
                atCapacity={atCapacity}
                onAccept={handleAccept}
                onReject={handleReject}
                accepting={accepting}
                rejecting={rejecting}
              />
            ))}
          </div>
        )
      ) : (
        active.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-muted" />
            <p className="text-sm font-bold text-foreground">No active deliveries</p>
            <p className="mt-1 text-xs text-muted">Switch to Available to pick up orders</p>
          </div>
        ) : (
          <>
            {/* GPS Status Card */}
            <div className={`rounded-2xl border p-4 shadow-sm transition-all ${tracking ? "border-brand-fresh/30 bg-brand-fresh/5" : "border-brand-red/30 bg-brand-red/5"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tracking ? "bg-brand-fresh/10" : "bg-brand-red/10"}`}>
                    <LocateFixed className={`h-5 w-5 ${tracking ? "text-brand-fresh" : "text-brand-red"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">Active Deliveries ({active.length})</h2>
                      {tracking ? (
                        <span className="flex items-center gap-1.5 text-[10px] text-brand-fresh font-semibold bg-brand-fresh/10 px-2 py-0.5 rounded-full">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-fresh opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-fresh" />
                          </span>
                          GPS Live
                        </span>
                      ) : (
                        <span className="text-[10px] text-brand-red font-semibold bg-brand-red/10 px-2 py-0.5 rounded-full">
                          <Radio className="mr-0.5 inline h-3 w-3" /> GPS {gpsError ? "Error" : "Off"}
                        </span>
                      )}
                    </div>
                    {currentPosition && (
                      <p className="text-[10px] text-muted mt-0.5 font-mono">
                        {currentPosition[0].toFixed(5)}, {currentPosition[1].toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">{active.length}</p>
                  <p className="text-[10px] text-muted -mt-0.5">active</p>
                </div>
              </div>
              {gpsError && (
                <p className="mt-2 text-[10px] text-brand-red bg-brand-red/5 rounded-lg px-3 py-2">{gpsError}</p>
              )}
            </div>

            {/* Pickup section */}
            {pickupStatuses.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wide">Pickup</h3>
                {pickupStatuses.map((a) => (
                  <DeliveryCard key={a.id} a={a} deliveryCodes={deliveryCodes} setDeliveryCodes={setDeliveryCodes} codeError={codeError} setCodeError={setCodeError} currentPosition={currentPosition} customerLocations={customerLocations} onAccept={handleAcceptDelivery} onPickUp={handlePickUp} onConfirm={handleConfirm} />
                ))}
              </div>
            )}

            {/* Out for Delivery section */}
            {outForDelivery.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-brand-fresh uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="h-4 w-4" /> Out for Delivery
                </h3>
                {outForDelivery.map((a) => (
                  <DeliveryCard key={a.id} a={a} deliveryCodes={deliveryCodes} setDeliveryCodes={setDeliveryCodes} codeError={codeError} setCodeError={setCodeError} currentPosition={currentPosition} customerLocations={customerLocations} onAccept={handleAcceptDelivery} onPickUp={handlePickUp} onConfirm={handleConfirm} />
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
