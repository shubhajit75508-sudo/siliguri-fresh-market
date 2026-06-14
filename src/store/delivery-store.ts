import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryBoy, DeliveryAssignment } from "@/types";
import { useAuthStore } from "./auth-store";

interface DeliveryState {
  boy: DeliveryBoy | null;
  assignments: DeliveryAssignment[];
  deliveryBoys: DeliveryBoy[];
  addDeliveryBoy: (boy: DeliveryBoy) => void;
  addBoy: (boy: DeliveryBoy) => void;
  removeBoy: (id: string) => void;
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
      deliveryBoys: [],

      addDeliveryBoy: (boy) =>
        set((state) => ({ deliveryBoys: [...state.deliveryBoys.filter((b) => b.id !== boy.id), boy] })),

      addBoy: (boy) =>
        set((state) => ({
          deliveryBoys: [...state.deliveryBoys.filter((b) => b.id !== boy.id), boy],
        })),

      removeBoy: (id) =>
        set((state) => ({
          deliveryBoys: state.deliveryBoys.filter((b) => b.id !== id),
        })),

      loginWithCode: () => false,

      setBoy: (boy: DeliveryBoy) => set({ boy }),

      loginAsBoy: (name: string, phone: string) => {
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser?.role !== "delivery") return false;
        const newBoy: DeliveryBoy = {
          id: currentUser.id,
          name: currentUser.name || name,
          phone: currentUser.phone || phone,
          code: "DEL" + (currentUser.phone || phone).slice(-3),
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
