"use client";

import { useState } from "react";
import { MessageCircle, Phone, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.add("Message sent! We'll respond within 30 minutes.");
    setMessage("");
  };

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

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6">
        <h3 className="font-bold">Send us a message</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          rows={4}
          className="mt-3 w-full rounded-xl border border-brand-dark/10 bg-white/50 p-4 text-sm focus:border-brand-fresh/50 focus:outline-none focus:ring-2 focus:ring-brand-fresh/20"
          required
        />
        <Button variant="fresh" type="submit" className="mt-3">
          <Send className="h-4 w-4" /> Send Message
        </Button>
      </form>
    </div>
  );
}
