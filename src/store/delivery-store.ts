import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DeliveryBoy, DeliveryAssignment } from "@/types";

interface DeliveryState {
  boy: DeliveryBoy | null;
  assignments: DeliveryAssignment[];
  deliveryBoys: DeliveryBoy[];
  addBoy: (boy: DeliveryBoy) => void;
  removeBoy: (id: string) => void;
  loadBoys: () => Promise<void>;
  loginAsBoy: (user: { id: string; name: string; phone: string } | null, name: string, phone: string) => boolean;
  logout: () => void;
  confirmDelivery: (assignmentId: string) => void;
  setAssignments: (assignments: DeliveryAssignment[]) => void;
  loadAssignments: () => Promise<void>;
}

export const useDeliveryStore = create<DeliveryState>()(
  devtools(
    persist(
      (set, get) => ({
        boy: null,
        assignments: [],
        deliveryBoys: [],

        addBoy: (boy) =>
          set((state) => ({
            deliveryBoys: [...state.deliveryBoys.filter((b) => b.id !== boy.id), boy],
          })),

        removeBoy: (id) =>
          set((state) => ({
            deliveryBoys: state.deliveryBoys.filter((b) => b.id !== id),
          })),

        loadBoys: async () => {
          try {
            const res = await fetch("/api/admin/delivery-boys");
            if (!res.ok) return;
            const json = await res.json();
            const boys: DeliveryBoy[] = (json.boys ?? []).map((b: Record<string, unknown>) => ({
              id: b.id as string,
              name: b.name as string,
              phone: b.phone as string,
              email: (b as { email?: string }).email ?? "",
              code: b.code as string,
              isActive: b.is_active as boolean,
              area: b.area as string,
              maxActiveOrders: (b as { max_active_orders?: number }).max_active_orders ?? 5,
            }));
            set((state) => {
              const merged = new Map(state.deliveryBoys.map((boy) => [boy.id, boy]));
              boys.forEach((boy) => merged.set(boy.id, boy));
              return { deliveryBoys: [...merged.values()] };
            });
          } catch {}
        },

        loginAsBoy: (user, name, phone) => {
          if (!user) return false;
          const newBoy: DeliveryBoy = {
            id: user.id,
            name: user.name || name,
            phone: user.phone || phone,
            code: "DEL" + (user.phone || phone).slice(-3),
            isActive: true,
            area: "Siliguri",
          };
          set({ boy: newBoy });
          return true;
        },

        logout: () => set({ boy: null }),

        confirmDelivery: (assignmentId) =>
          set((state) => ({
            assignments: state.assignments.map((a) =>
              a.id === assignmentId
                ? { ...a, status: "delivered" as const, deliveredAt: new Date().toISOString() }
                : a
            ),
          })),

        setAssignments: (assignments) => set({ assignments }),

        loadAssignments: async () => {
          const state = get();
          if (!state.boy?.id) return;
          try {
            const res = await fetch(`/api/delivery/assignments?boy_id=${encodeURIComponent(state.boy.id)}`);
            if (!res.ok) return;
            const json = await res.json();
            if (json.assignments) set({ assignments: json.assignments });
          } catch {}
        },
      }),
      { name: "sfm-delivery-v2" }
    ),
    { name: "DeliveryStore" }
  )
);
