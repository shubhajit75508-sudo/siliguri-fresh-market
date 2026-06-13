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
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
      { headers: { "User-Agent": "SiliguriFreshMart/1.0" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.display_name) {
          setResolvedAddress(data.display_name);
        }
      })
      .catch(() => setError("Could not resolve address from your location. Try entering pincode manually."));
  }, [location]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
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
  }, []);

  return { location, locating, error, resolvedAddress, getLocation, reset };
}
