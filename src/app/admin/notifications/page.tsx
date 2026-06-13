"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Send } from "lucide-react";
import { useNotificationStore } from "@/store/notification-store";
import { useToast } from "@/components/ui/toaster";

export default function AdminNotificationsPage() {
  const { notifications, addNotification, deleteNotification } = useNotificationStore();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "promotional" as const, sentTo: 100 });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.add("Enter a title", "error"); return; }
    addNotification({ title: form.title, body: form.body, type: form.type, sentTo: form.sentTo });
    setForm({ title: "", body: "", type: "promotional", sentTo: 100 });
    setShowForm(false);
    toast.add("Notification sent");
  };

  const typeColors: Record<string, string> = {
    promotional: "bg-blue-100 text-blue-700",
    order: "bg-green-100 text-green-700",
    membership: "bg-purple-100 text-purple-700",
    alert: "bg-orange-100 text-orange-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Button variant="default" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Send Notification
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSend} className="mt-4 max-w-md rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Body text" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark">
              <option value="promotional">Promotional</option>
              <option value="order">Order</option>
              <option value="membership">Membership</option>
              <option value="alert">Alert</option>
            </select>
            <input type="number" value={form.sentTo} onChange={(e) => setForm({ ...form, sentTo: Number(e.target.value) })} placeholder="Recipients" className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="default" size="sm"><Send className="h-4 w-4" /> Send</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${typeColors[n.type] || "bg-gray-100"}`}>
                    {n.type}
                  </span>
                </div>
                {n.body && <p className="mt-1 text-sm text-gray-500">{n.body}</p>}
                <p className="mt-1 text-xs text-gray-400">Sent to {n.sentTo} users · {n.sentAt}</p>
              </div>
              <button onClick={() => deleteNotification(n.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="h-4 w-4 text-brand-red" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
