import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, CartItem, Address, DeliveryStatus } from "@/types";
import { useDeliveryStore } from "./delivery-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncOrderToSupabase } from "@/lib/supabase/queries";

interface OrderStats {
  totalOrders: number;
  revenueToday: number;
  ordersToday: number;
  activeDeliveries: number;
  pendingOrders: number;
}

interface OrderState {
  orders: Order[];
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
            await syncOrderToSupabase({
              id,
              items: data.items.map((i) => ({ product: { id: i.product.id, name: i.product.name, price: i.product.price, image: i.product.image }, quantity: i.quantity })),
              total: data.total,
              status: "received",
              payment_method: data.paymentMethod,
              customer_name: data.customerName,
              customer_phone: data.customerPhone,
              customer_email: data.customerEmail,
              address_snapshot: data.address as unknown as Record<string, unknown>,
            });
          } catch {}
        }
        return id;
      },

      updateStatus: async (id, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status } : o
          ),
        }));
        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ status }).eq("id", id);
          } catch {}
        }
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
            address: order.address,
            items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
            total: order.total,
            status: "assigned",
            assignedAt: new Date().toISOString(),
          },
        ]);

        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ delivery_boy_id: boyId, delivery_status: "assigned", status: "out_for_delivery" }).eq("id", orderId);
          } catch {}
        }
      },

      acceptDelivery: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, deliveryStatus: "accepted" as DeliveryStatus } : o
          ),
        }));
        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ delivery_status: "accepted" }).eq("id", orderId);
          } catch {}
        }
      },

      pickUpDelivery: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, deliveryStatus: "picked_up" as DeliveryStatus } : o
          ),
        }));
        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ delivery_status: "picked_up" }).eq("id", orderId);
          } catch {}
        }
      },

      confirmDelivery: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, deliveryStatus: "delivered" as DeliveryStatus, status: "delivered" as Order["status"] }
              : o
          ),
        }));
        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ delivery_status: "delivered", status: "delivered" }).eq("id", orderId);
          } catch {}
        }
      },

      requestReturn: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, returnRequested: true } : o
          ),
        }));
        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ return_requested: true }).eq("id", orderId);
          } catch {}
        }
      },

      approveReturn: async (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, returnApproved: true } : o
          ),
        }));
        if (isSupabaseConfigured()) {
          try {
            await supabase!.from("orders").update({ return_approved: true }).eq("id", orderId);
          } catch {}
        }
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