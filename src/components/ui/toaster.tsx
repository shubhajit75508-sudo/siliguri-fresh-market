"use client";

import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: Toast["type"]) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "success") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function Toaster() {
  const { toasts, remove } = useToast();
  const icons = { success: CheckCircle, error: XCircle, info: Info };
  const colors = {
    success: "border-brand-fresh/30 bg-brand-fresh/10 text-brand-fresh",
    error: "border-brand-red/30 bg-brand-red/10 text-brand-red",
    info: "border-brand-blue/30 bg-brand-blue/10 text-brand-blue",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 glass-card ${colors[toast.type]}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium text-foreground">{toast.message}</span>
              <button onClick={() => remove(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
