import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryBoy, DeliveryAssignment } from "@/types";
import { useAuthStore } from "./auth-store";

interface DeliveryState {
  boy: DeliveryBoy | null;
  assignments: DeliveryAssignment[];
  loginWithCode: (code: string) => boolean;
  loginAsBoy: (name: string, phone: string) => boolean;
  logout: () => void;
  confirmDelivery: (assignmentId: string) => void;
  setAssignments: (assignments: DeliveryAssignment[]) => void;
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      boy: null,
      assignments: [],

      loginWithCode: () => false,

      loginAsBoy: (name: string, phone: string) => {
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser?.role !== "delivery") return false;

        const newBoy: DeliveryBoy = {
          id: "db-" + crypto.randomUUID().slice(0, 6),
          name,
          phone,
          code: "DEL" + phone.slice(-3),
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
    }),
    { name: "sfm-delivery" }
  )
);
