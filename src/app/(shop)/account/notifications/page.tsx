"use client";

import { useNotificationStore } from "@/store/notification-store";
import { Bell, Tag, Truck, Gift, X } from "lucide-react";

const typeIcons: Record<string, typeof Bell> = {
  promotional: Tag,
  order: Truck,
  membership: Gift,
  alert: Bell,
};

export default function NotificationsPage() {
  const { notifications, markRead, deleteNotification } = useNotificationStore();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Notifications</h2>
      <div className="space-y-2">
        {notifications.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No notifications</p>
        )}
        {notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl p-4 ${n.read ? "bg-white/30" : "glass-card"}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-muted mt-0.5">{n.body}</p>}
                <p className="text-xs text-muted mt-1">{n.sentAt}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="h-2 w-2 rounded-full bg-brand-fresh" title="Mark as read" />
                )}
                <button onClick={() => deleteNotification(n.id)} className="rounded-lg p-1 hover:bg-red-50">
                  <X className="h-3 w-3 text-muted hover:text-brand-red" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
