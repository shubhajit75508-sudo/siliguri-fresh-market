"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAdminStore } from "@/store/admin-store";
import { useToast } from "@/components/ui/toaster";
import { Settings, Home, Eye, EyeOff } from "lucide-react";

type Tab = "general" | "home";

export default function SettingsPage() {
  const { settings, updateSettings } = useAdminStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("general");
  const [form, setForm] = useState({ ...settings });
  const edited = useRef(false);

  useEffect(() => {
    if (!edited.current) {
      setForm({ ...settings });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(form);
    toast.add("Settings saved");
  };

  const updateSection = (idx: number, patch: Partial<typeof form.sections[number]>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setTab("general")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "general" ? "bg-brand-dark text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings className="h-4 w-4" /> General
        </button>
        <button
          onClick={() => setTab("home")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "home" ? "bg-brand-dark text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Home className="h-4 w-4" /> Home Page
        </button>
      </div>

      {tab === "general" && (
        <div className="max-w-lg space-y-6">
          {([
            { key: "storeName", label: "Store Name", type: "text" },
            { key: "deliveryRadius", label: "Delivery Radius", type: "text" },
            { key: "minOrderAmount", label: "Min Order Amount", type: "text" },
            { key: "deliveryFee", label: "Delivery Fee", type: "text" },
            { key: "operatingHours", label: "Operating Hours", type: "text" },
          ] as const).map(({ key, label, type }) => (
            <div key={key} className="rounded-xl border bg-white p-4 shadow-sm">
              <label className="text-xs font-medium text-gray-500">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => { setForm({ ...form, [key]: e.target.value }); edited.current = true; }}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark"
              />
            </div>
          ))}
          <Button variant="default" onClick={handleSave}>Save Changes</Button>
        </div>
      )}

      {tab === "home" && (
        <div className="max-w-2xl space-y-8">
          {/* Hero section */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold">Hero Banner</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Background Image URL</label>
                <input
                  type="text"
                  value={form.hero.image}
                  onChange={(e) => { setForm({ ...form, hero: { ...form.hero, image: e.target.value } }); edited.current = true; }}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Title (use \n for line break)</label>
                <textarea
                  value={form.hero.title}
                  onChange={(e) => { setForm({ ...form, hero: { ...form.hero, title: e.target.value } }); edited.current = true; }}
                  rows={2}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Subtitle</label>
                <textarea
                  value={form.hero.subtitle}
                  onChange={(e) => { setForm({ ...form, hero: { ...form.hero, subtitle: e.target.value } }); edited.current = true; }}
                  rows={2}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-dark"
                />
              </div>
            </div>
          </div>

          {/* Product sections */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold">Category Sections on Home Page</h3>
            <p className="mb-4 text-xs text-gray-500">Toggle visibility and edit titles for each category section.</p>
            <div className="space-y-3">
              {form.sections.map((sec, idx) => (
                <div
                  key={sec.category}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${
                    sec.enabled ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <button
                    onClick={() => updateSection(idx, { enabled: !sec.enabled })}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      sec.enabled ? "bg-brand-fresh text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {sec.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase">{sec.category}</p>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => updateSection(idx, { title: e.target.value })}
                      className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand-dark"
                    />
                    <input
                      type="text"
                      value={sec.subtitle}
                      onChange={(e) => updateSection(idx, { subtitle: e.target.value })}
                      className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand-dark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="default" onClick={handleSave}>Save Changes</Button>
        </div>
      )}
    </div>
  );
}
