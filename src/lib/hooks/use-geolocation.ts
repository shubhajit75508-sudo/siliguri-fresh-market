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
      // Retry once with different options
      if (err.code === 3) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (e2) => {
            setError(e2.code === 1 ? "Location denied" : "Location unavailable — try manual entry");
            setLocating(false);
          },
          { enableHighAccuracy: false, timeout: 15000 }
        );
      } else {
        setLocating(false);
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 10000,
    });
  }, []);

  const reset = useCallback(() => {
    setLocation(null);
    setError("");
    setResolvedAddress("");
  }, []);

  return { location, locating, error, resolvedAddress, getLocation, reset };
}