"use client";

import { use, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReturnPolicyBanner, ReturnRequestModal, isWithinReplacementWindow, getRemainingTime } from "@/components/ui/return-policy";

const stages = [
  { id: "received", label: "Order Received", icon: Package },
  { id: "out_for_delivery", label: "Out For Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle },
];

const STORAGE_KEY = "sfm-track-delivered";

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [currentStage, setCurrentStage] = useState(0);
  const [showReturn, setShowReturn] = useState(false);
  const deliveredAtRef = useRef<string | null>(null);

  if (!deliveredAtRef.current && typeof window !== "undefined") {
    deliveredAtRef.current = sessionStorage.getItem(`${STORAGE_KEY}-${orderId}`);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) {
          const next = prev + 1;
          if (next === stages.length - 1) {
            const ts = new Date().toISOString();
            deliveredAtRef.current = ts;
            sessionStorage.setItem(`${STORAGE_KEY}-${orderId}`, ts);
          }
          return next;
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId]);

  const deliveredAt = deliveredAtRef.current ?? undefined;
  const isDelivered = currentStage === stages.length - 1;
  const inWindow = isDelivered && deliveredAt && isWithinReplacementWindow(deliveredAt);

  return (
    <div className="py-6">
      <div className="text-center">
        <Badge variant="fresh" className="mb-3">Live Tracking</Badge>
        <h1 className="text-2xl font-extrabold">Order {orderId}</h1>
        <p className="mt-1 text-muted">Estimated delivery: 30 min — 1 hour</p>
      </div>

      {/* Map placeholder */}
      <div className="relative mt-8 h-48 overflow-hidden rounded-2xl glass-card sm:h-64">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-fresh/10 to-brand-blue/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-brand-fresh" />
            <p className="mt-2 text-sm font-medium">Delivery partner is on the way</p>
            <p className="text-xs text-muted">2.3 km away · Hill Cart Road</p>
          </div>
        </div>
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute right-1/4 top-1/3"
        >
          <Truck className="h-6 w-6 text-brand-blue" />
        </motion.div>
      </div>

      {/* Return / replacement */}
      {isDelivered && (
        <div className="mt-6 space-y-3">
          <ReturnPolicyBanner deliveredAt={deliveredAt} />
          {inWindow ? (
            <button
              onClick={() => setShowReturn(true)}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface transition-colors"
            >
              Request Replacement ({deliveredAt ? getRemainingTime(deliveredAt) : "3 hours"})
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Replacement window expired
            </div>
          )}
        </div>
      )}

      {showReturn && deliveredAt && (
        <ReturnRequestModal orderId={orderId} deliveredAt={deliveredAt} onClose={() => setShowReturn(false)} />
      )}

      {/* Timeline */}
      <div className="mt-8 space-y-0">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i <= currentStage;
          const isCurrent = i === currentStage;
          return (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-brand-fresh text-white"
                      : "bg-brand-dark/5 text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                {i < stages.length - 1 && (
                  <div
                    className={`h-12 w-0.5 ${
                      i < currentStage ? "bg-brand-fresh" : "bg-brand-dark/10"
                    }`}
                  />
                )}
              </div>
              <div className="pb-8 pt-2">
                <p
                  className={`text-sm font-semibold ${
                    isActive ? "text-brand-dark" : "text-muted"
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-brand-fresh"
                  >
                    In progress...
                  </motion.p>
                )}
                {isActive && !isCurrent && (
                  <p className="text-xs text-muted">Completed</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
