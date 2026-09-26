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
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-[100] flex flex-col items-stretch gap-2 sm:left-auto sm:items-end">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`glass-card pointer-events-auto flex max-w-full items-start gap-3 rounded-xl border px-4 py-3 sm:max-w-sm ${colors[toast.type]}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">{toast.message}</span>
              <button
                onClick={() => remove(toast.id)}
                aria-label="Dismiss notification"
                className="-mr-1 shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
