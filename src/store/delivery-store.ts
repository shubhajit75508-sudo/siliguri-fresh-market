import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DeliveryBoy, DeliveryAssignment } from "@/types";

interface DeliveryState {
  boy: DeliveryBoy | null;
  assignments: DeliveryAssignment[];
  deliveryBoys: DeliveryBoy[];
  addBoy: (boy: DeliveryBoy) => void;
  removeBoy: (id: string) => void;
  loginAsBoy: (user: { id: string; name: string; phone: string } | null, name: string, phone: string) => boolean;
  logout: () => void;
  confirmDelivery: (assignmentId: string) => void;
  setAssignments: (assignments: DeliveryAssignment[]) => void;
}

export const useDeliveryStore = create<DeliveryState>()(
  devtools(
    persist(
      (set) => ({
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
      }),
      { name: "sfm-delivery-v2" }
    ),
    { name: "DeliveryStore" }
  )
);
