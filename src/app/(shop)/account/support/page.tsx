"use client";

import { MessageCircle, Phone, Mail } from "lucide-react";

export default function SupportPage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Help & Support</h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Phone, label: "Call Us", value: "+91 98765 43210" },
          { icon: Mail, label: "Email", value: "support@sfm.com" },
          { icon: MessageCircle, label: "WhatsApp", value: "Chat Now" },
        ].map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-4 text-center">
            <c.icon className="mx-auto h-6 w-6 text-brand-fresh" />
            <p className="mt-2 text-xs text-muted">{c.label}</p>
            <p className="text-sm font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold">Send us a message</h3>
        <textarea
          disabled
          placeholder="Coming soon"
          rows={4}
          className="mt-3 w-full rounded-xl border border-brand-dark/10 bg-white/8 p-4 text-sm opacity-60 cursor-not-allowed"
        />
        <p className="mt-3 text-xs text-muted">Messaging support is coming soon. Please call or email us for now.</p>
      </div>
    </div>
  );
}
