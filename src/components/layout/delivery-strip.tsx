"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Clock, ChevronDown, Navigation, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useGeolocation } from "@/lib/hooks/use-geolocation";

const PINCODE_REGEX = /^\d{6}$/;

export function DeliveryStrip() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { deliveryPincode, setDeliveryPincode, addresses } = useUserStore();
  const { locating, error: locationError, resolvedAddress, getLocation } = useGeolocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (resolvedAddress) {
      const match = resolvedAddress.match(/\b\d{6}\b/);
      if (match) {
        setDeliveryPincode(match[0]);
        setOpen(false);
      }
    }
  }, [resolvedAddress]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (PINCODE_REGEX.test(trimmed)) {
      setDeliveryPincode(trimmed);
      setInputValue("");
      setOpen(false);
    }
  };

  const selectPincode = (pincode: string) => {
    setDeliveryPincode(pincode);
    setOpen(false);
  };

  const cityLabel = deliveryPincode === "734001" ? "Siliguri" : `Pincode`;

  return (
    <div className="border-b border-border bg-surface-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 font-medium text-foreground transition-opacity hover:opacity-70"
          >
            <MapPin className="h-3.5 w-3.5 text-brand-fresh-dim" />
            <span className="text-muted">Deliver to</span>
            <span className="font-semibold">
              {cityLabel}, {deliveryPincode}
            </span>
            <ChevronDown className="h-3 w-3 text-muted" />
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-border bg-[#0d1b2a] p-4 shadow-xl z-50">
              <p className="mb-3 text-sm font-bold">Delivery Location</p>

              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="mb-3 space-y-1">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => selectPincode(addr.pincode)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-surface ${
                        deliveryPincode === addr.pincode ? "bg-brand-fresh/10 font-semibold text-brand-fresh-dim" : ""
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate">{addr.label} — {addr.pincode}</span>
                    </button>
                  ))}
                  <hr className="my-2 border-border" />
                </div>
              )}

              {/* Live location */}
              <button
                onClick={getLocation}
                disabled={locating}
                className="mb-3 flex w-full items-center gap-2 rounded-xl bg-brand-fresh/5 px-3 py-2.5 text-sm font-medium text-brand-fresh-dim transition-colors hover:bg-brand-fresh/10 disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {locating ? "Detecting location..." : "Use Live Location"}
              </button>
              {locationError && <p className="mb-2 text-xs text-brand-red">{locationError}</p>}

              {/* Custom pincode input */}
              <p className="mb-2 text-xs font-medium text-muted">Enter a pincode</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="734001"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand-fresh/40"
                />
                <button
                  onClick={handleSave}
                  disabled={!PINCODE_REGEX.test(inputValue.trim())}
                  className="shrink-0 rounded-xl bg-brand-fresh px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-brand-fresh-dim disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden items-center gap-1.5 font-medium text-muted sm:flex">
          <Clock className="h-3.5 w-3.5 text-brand-fresh-dim" />
          <span>
            Arriving in <span className="font-semibold text-white">10–15 min</span>
          </span>
        </div>
      </div>
    </div>
  );
}
