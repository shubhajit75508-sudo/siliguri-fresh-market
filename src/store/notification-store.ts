import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "promotional" | "order" | "membership" | "alert";
  sentAt: string;
  sentTo: number;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (n: Omit<NotificationItem, "id" | "sentAt" | "read">) => void;
  markRead: (id: string) => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set) => ({
        notifications: [],
        addNotification: (n) =>
          set((state) => ({
            notifications: [
              { ...n, id: crypto.randomUUID(), sentAt: new Date().toISOString(), read: false },
              ...state.notifications,
            ],
          })),
        markRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          })),
        deleteNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
      }),
      { name: "sfm-notifications", version: 1 }
    ),
    { name: "NotificationStore" }
  )
);
