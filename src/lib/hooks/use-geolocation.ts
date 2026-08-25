"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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
  const autoFired = useRef(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);
    setError("");

    const onSuccess = (pos: GeolocationPosition) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocating(false);
      fetch(`/api/geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.display_name) setResolvedAddress(data.display_name);
        })
        .catch(() => {});
    };

    const onError = (err: GeolocationPositionError) => {
      const msg = err.code === 1
        ? "Location denied — enable in browser settings"
        : err.code === 2
        ? "Location unavailable — check GPS/WiFi"
        : err.code === 3
        ? "Timed out — please try again"
        : err.message;
      setError(msg);
      if (err.code === 3 || err.code === 2) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (e2) => {
            setError(e2.code === 1 ? "Location denied" : "Location unavailable — try again");
            setLocating(false);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
        );
      } else {
        setLocating(false);
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });
  }, []);

  const reset = useCallback(() => {
    setLocation(null);
    setError("");
    setResolvedAddress("");
  }, []);

  // Auto-detect on mount (fires once)
  useEffect(() => {
    if (autoFired.current) return;
    autoFired.current = true;
    getLocation();
  }, [getLocation]);

  return { location, locating, error, resolvedAddress, getLocation, reset };
}
