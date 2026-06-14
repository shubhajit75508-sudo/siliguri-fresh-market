"use client";

import { useState, useCallback, useEffect } from "react";

interface GeoLocation {
  lat: number;
  lng: number;
}

interface UseGeolocationReturn {
  location: GeoLocation | null;
  locating: boolean;
  error: string;
  resolvedAddress: string;
  getLocation: () => void;
  reset: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");

  useEffect(() => {
    if (!location) {
      setResolvedAddress("");
      return;
    }
    console.log("[useGeolocation] Reverse geocoding...");
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
      { headers: { "User-Agent": "SiliguriFreshMart/1.0" }, signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.display_name) {
          console.log("[useGeolocation] Resolved address:", data.display_name.slice(0, 80));
          setResolvedAddress(data.display_name);
        } else {
          console.warn("[useGeolocation] No display_name in response");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("[useGeolocation] Reverse geocode failed:", err);
          setError("Could not resolve address from your location. Try entering pincode manually.");
        }
      });
    return () => controller.abort();
  }, [location]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      console.warn("[useGeolocation] navigator.geolocation is null");
      return;
    }
    setLocating(true);
    setError("");
    console.log("[useGeolocation] Requesting position...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[useGeolocation] Position received:", pos.coords.latitude, pos.coords.longitude);
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn("[useGeolocation] Error:", err.code, err.message);
        setError(
          err.code === 1
            ? "Location access denied. Enable location in browser settings."
            : err.message
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const reset = useCallback(() => {
    setLocation(null);
    setError("");
    setResolvedAddress("");
  }, []);

  return { location, locating, error, resolvedAddress, getLocation, reset };
}
