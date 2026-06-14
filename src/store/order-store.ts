import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Order, CartItem, Address, DeliveryStatus, DeliveryAssignment } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const API = "/api/admin/orders";

async function apiPut(data: Record<string, unknown>): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const res = await fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { console.warn("[apiPut] PUT %s returned %d", data.id, res.status); return false; }
    return true;
  } catch (e) { console.error("[apiPut] network error:", e); return false; }
}

interface OrderStats {
  totalOrders: number;
  revenueToday: number;
  ordersToday: number;
  activeDeliveries: number;
  pendingOrders: number;
}

interface OrderState {
  orders: Order[];
  loaded: boolean;
  loadOrders: () => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  createOrder: (data: {
    items: CartItem[];
    total: number;
    address: Address;
    paymentMethod: string;
    paymentStatus: "paid" | "unpaid";
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  }) => Promise<string>;
  updateStatus: (id: string, status: Order["status"]) => Promise<void>;
  assignDeliveryBoy: (orderId: string, boyId: string, boyName: string) => Promise<{ assignment: DeliveryAssignment } | void>;
  acceptDelivery: (orderId: string) => Promise<void>;
  pickUpDelivery: (orderId: string) => Promise<void>;
  confirmDelivery: (orderId: string) => Promise<void>;
  requestReturn: (orderId: string) => Promise<void>;
  approveReturn: (orderId: string) => Promise<void>;
  getStats: () => OrderStats;
}

export const useOrderStore = create<OrderState>()(
  devtools(
    persist(
      (set, get) => ({
        orders: [],
        loaded: false,

        loadOrders: async () => {
          if (!isSupabaseConfigured()) {
            console.warn("[loadOrders] Supabase not configured, skipping remote fetch");
            set({ loaded: true });
            return;
          }
          try {
            const res = await fetch("/api/admin/orders");
            if (!res.ok) throw new Error("Failed to fetch orders");
            const json = await res.json();
            const remoteOrders: Order[] = (json.orders ?? []).map((r: Record<string, unknown>) => ({
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
              deliveryStatus: (r.delivery_status as DeliveryStatus) ?? "pending",
              deliveryBoyId: r.delivery_boy_id as string | undefined,
              deliveryBoyName: r.delivery_boy_name as string | undefined,
              returnRequested: Boolean(r.return_requested),
              returnApproved: Boolean(r.return_approved),
            }));
            set((state) => {
              const local = state.orders;
              const mergedMap = new Map(local.map((o) => [o.id, o]));
              for (const o of remoteOrders) {
                mergedMap.set(o.id, o);
              }
              return { orders: Array.from(mergedMap.values()), loaded: true };
            });
          } catch (e) { console.error("loadOrders failed:", e); set({ loaded: true }); }
        },

        cancelOrder: async (id) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, status: "cancelled" as Order["status"] } : o
            ),
          }));
          const ok = await apiPut({ id, status: "cancelled" });
          if (!ok) set({ orders: prev });
        },

        createOrder: async (data) => {
          const id = "SFM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
          const order: Order = {
            id,
            items: data.items,
            status: "received",
            total: data.total,
            createdAt: new Date().toISOString(),
            address: data.address,
            eta: 30 + Math.floor(Math.random() * 31),
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            deliveryStatus: "pending",
          };
          set((state) => ({ orders: [...state.orders, order] }));
          if (isSupabaseConfigured()) {
            try {
              await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id,
                  items: data.items.map((i) => ({ product: { id: i.product.id, name: i.product.name, price: i.product.price, image: i.product.image }, quantity: i.quantity })),
                  total: data.total,
                  status: "received",
                  payment_method: data.paymentMethod,
                  payment_status: data.paymentStatus,
                  customer_name: data.customerName,
                  customer_phone: data.customerPhone,
                  customer_email: data.customerEmail,
                  address_snapshot: data.address as unknown as Record<string, unknown>,
                  created_at: order.createdAt,
                }),
              });
            } catch (e) { console.error("Order sync failed:", e); }
          }
          return id;
        },

        updateStatus: async (id, status) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, status } : o
            ),
          }));
          const ok = await apiPut({ id, status });
          if (!ok) set({ orders: prev });
        },

        assignDeliveryBoy: async (orderId, boyId, boyName) => {
          const order = get().orders.find((o) => o.id === orderId);
          if (!order) return;

          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, deliveryBoyId: boyId, deliveryBoyName: boyName, deliveryStatus: "assigned" as DeliveryStatus, status: "out_for_delivery" as Order["status"] }
                : o
            ),
          }));

          const ok = await apiPut({ id: orderId, delivery_boy_id: boyId, delivery_boy_name: boyName, delivery_status: "assigned", status: "out_for_delivery" });
          if (!ok) {
            set({ orders: prev });
            return;
          }

          return {
            assignment: {
              id: "da-" + Date.now(),
              orderId,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              paymentStatus: order.paymentStatus,
              address: {
                id: order.id + "-addr",
                label: "Delivery",
                line1: order.address.line1,
                line2: order.address.line2,
                area: order.address.area,
                landmark: order.address.landmark,
                building: order.address.building,
                flat: order.address.flat,
                floor: order.address.floor,
                city: order.address.city,
                pincode: order.address.pincode,
                lat: order.address.lat,
                lng: order.address.lng,
                isDefault: false,
              },
              items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
              total: order.total,
              status: "assigned" as const,
              assignedAt: new Date().toISOString(),
            },
          };
        },

        acceptDelivery: async (orderId) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, deliveryStatus: "accepted" as DeliveryStatus } : o
            ),
          }));
          const ok = await apiPut({ id: orderId, delivery_status: "accepted" });
          if (!ok) set({ orders: prev });
        },

        pickUpDelivery: async (orderId) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, deliveryStatus: "picked_up" as DeliveryStatus } : o
            ),
          }));
          const ok = await apiPut({ id: orderId, delivery_status: "picked_up" });
          if (!ok) set({ orders: prev });
        },

        confirmDelivery: async (orderId) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, deliveryStatus: "delivered" as DeliveryStatus, status: "delivered" as Order["status"] }
                : o
            ),
          }));
          const ok = await apiPut({ id: orderId, delivery_status: "delivered", status: "delivered" });
          if (!ok) set({ orders: prev });
        },

        requestReturn: async (orderId) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, returnRequested: true } : o
            ),
          }));
          const ok = await apiPut({ id: orderId, return_requested: true });
          if (!ok) set({ orders: prev });
        },

        approveReturn: async (orderId) => {
          const prev = get().orders;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, returnApproved: true } : o
            ),
          }));
          const ok = await apiPut({ id: orderId, return_approved: true });
          if (!ok) set({ orders: prev });
        },

        getStats: () => {
          const orders = get().orders;
          const today = new Date().toDateString();
          const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
          const revenueToday = todayOrders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
          return {
            totalOrders: orders.length,
            revenueToday,
            ordersToday: todayOrders.length,
            activeDeliveries: orders.filter((o) => o.deliveryStatus === "assigned" || o.deliveryStatus === "accepted" || o.deliveryStatus === "picked_up").length,
            pendingOrders: orders.filter((o) => o.status === "received").length,
          };
        },
      }),
      { name: "sfm-orders", version: 1 }
    ),
    { name: "OrderStore" }
  )
);