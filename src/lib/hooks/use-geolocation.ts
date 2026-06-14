"use client";

import { useState, useCallback } from "react";

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
        // Attempt reverse geocode via server proxy (silent failure)
        fetch(`/api/geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.display_name) {
              console.log("[useGeolocation] Address resolved:", data.display_name.slice(0, 80));
              setResolvedAddress(data.display_name);
            }
          })
          .catch(() => {});
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