"use client";

import { useState, useCallback } from "react";

interface GeoLocation {
  lat: number;
  lng: number;
}

interface ResolvedAddress {
  area?: string;
  landmark?: string;
  building?: string;
  city?: string;
  pincode?: string;
}

interface UseGeolocationReturn {
  location: GeoLocation | null;
  locating: boolean;
  error: string;
  resolvedAddress: string;
  resolvedFields: ResolvedAddress | null;
  getLocation: () => void;
  reset: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [resolvedFields, setResolvedFields] = useState<ResolvedAddress | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      setLocating(false);
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        fetch(`/api/geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.display_name) {
              setResolvedAddress(data.display_name);
            }
            if (data?.address) {
              setResolvedFields(data.address);
            }
          })
          .catch(() => {});
      },
      (err) => {
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
    setResolvedFields(null);
  }, []);

  return { location, locating, error, resolvedAddress, resolvedFields, getLocation, reset };
}