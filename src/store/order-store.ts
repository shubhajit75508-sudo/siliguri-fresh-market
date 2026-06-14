import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, CartItem, Address, DeliveryStatus } from "@/types";
import { useDeliveryStore } from "./delivery-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const API = "/api/admin/orders";

async function apiPut(data: Record<string, unknown>) {
  if (!isSupabaseConfigured()) return;
  try {
    await fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  } catch (e) { console.error("Order sync failed:", e); }
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
  createOrder: (data: {
    items: CartItem[];
    total: number;
    address: Address;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  }) => Promise<string>;
  updateStatus: (id: string, status: Order["status"]) => Promise<void>;
  assignDeliveryBoy: (orderId: string, boyId: string, boyName: string) => Promise<void>;
  acceptDelivery: (orderId: string) => Promise<void>;
  pickUpDelivery: (orderId: string) => Promise<void>;
  confirmDelivery: (orderId: string) => Promise<void>;
  requestReturn: (orderId: string) => Promise<void>;
  approveReturn: (orderId: string) => Promise<void>;
  getStats: () => OrderStats;
}

export const useOrderStore = create<OrderState>()(
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
            deliveryStatus: (r.delivery_status as DeliveryStatus) ?? "pending",
            deliveryBoyId: r.delivery_boy_id as string | undefined,
            returnRequested: Boolean(r.return_requested),
            returnApproved: Boolean(r.return_approved),
          }));
          set((state) => {
            const local = state.orders;
            const remoteMap = new Map(remoteOrders.map((o) => [o.id, o]));
            for (const o of local) {
              if (!remoteMap.has(o.id)) remoteMap.set(o.id, o);
            }
            return { orders: Array.from(remoteMap.values()), loaded: true };
          });
        } catch (e) { console.error("loadOrders failed:", e); set({ loaded: true }); }
      },

      createOrder: async (data) => {
        const id = "SFM-" + Date.now().toString(36).toUpperCase();
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
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status } : o
          ),
        }));
        await apiPut({ id, status });
      },

      assignDeliveryBoy: async (orderId, boyId, boyName) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, deliveryBoyId: boyId, deliveryStatus: "assigned" as DeliveryStatus, status: "out_for_delivery" as Order["status"] }
              : o
          ),
        }));

        const deliveryStore = useDeliveryStore.getState();
        deliveryStore.setAssignments([
          ...deliveryStore.assignments,
          {
            id: "da-" + Date.now(),
            orderId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
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
            status: "assigned",
            assignedAt: new Date().toISOString(),
          },
        ]);

        await apiPut({ id: orderId, delivery_boy_id: boyId, delivery_status: "assigned", status: "out_for_delivery" });
      },

      acceptDelivery: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, deliveryStatus: "accepted" as DeliveryStatus } : o
          ),
        }));
        await apiPut({ id: orderId, delivery_status: "accepted" });
      },

      pickUpDelivery: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, deliveryStatus: "picked_up" as DeliveryStatus } : o
          ),
        }));
        await apiPut({ id: orderId, delivery_status: "picked_up" });
      },

      confirmDelivery: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, deliveryStatus: "delivered" as DeliveryStatus, status: "delivered" as Order["status"] }
              : o
          ),
        }));
        await apiPut({ id: orderId, delivery_status: "delivered", status: "delivered" });
      },

      requestReturn: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, returnRequested: true } : o
          ),
        }));
        await apiPut({ id: orderId, return_requested: true });
      },

      approveReturn: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, returnApproved: true } : o
          ),
        }));
        await apiPut({ id: orderId, return_approved: true });
      },

      getStats: () => {
        const orders = get().orders;
        const today = new Date().toDateString();
        const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
        const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
        return {
          totalOrders: orders.length,
          revenueToday,
          ordersToday: todayOrders.length,
          activeDeliveries: orders.filter((o) => o.deliveryStatus === "assigned" || o.deliveryStatus === "accepted" || o.deliveryStatus === "picked_up").length,
          pendingOrders: orders.filter((o) => o.status === "received").length,
        };
      },
    }),
    { name: "sfm-orders" }
  )
);