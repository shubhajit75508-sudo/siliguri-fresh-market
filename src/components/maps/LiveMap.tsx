"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPinIcon = "boy" | "customer" | "store" | "order" | "active";

export interface LiveMapMarker {
  position: [number, number];
  icon?: MapPinIcon;
  label?: string;
}

export interface LiveMapPolyline {
  points: [number, number][];
  color?: string;
  dash?: string;
}

interface LiveMapProps {
  center: [number, number];
  zoom?: number;
  markers?: LiveMapMarker[];
  polylines?: LiveMapPolyline[];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const iconUrls: Record<MapPinIcon, string> = {
  boy: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  customer: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  store: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  order: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  active: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
};

export default function LiveMap({
  center,
  zoom = 14,
  markers = [],
  polylines = [],
  onMapClick,
  className = "h-80 w-full rounded-2xl",
}: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<L.Marker[]>([]);
  const polyRefs = useRef<L.Polyline[]>([]);
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;

  // Track container size — Leaflet needs a valid size on mount when the parent
  // is hidden behind a modal (e.g. pin-on-map inside the new-order modal).
  const sizeCheckRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      clickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      if (sizeCheckRef.current !== null) window.clearTimeout(sizeCheckRef.current);
      map.remove();
      mapRef.current = null;
      markerRefs.current = [];
      polyRefs.current = [];
    };
  }, []);

  // Invalidate size shortly after mount so a map rendered inside a newly-opened
  // modal gets correct tile bounds instead of 0×0 gray area.
  useEffect(() => {
    if (!mapRef.current) return;
    sizeCheckRef.current = window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 250);
    return () => {
      if (sizeCheckRef.current !== null) window.clearTimeout(sizeCheckRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center[0], center[1], zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    markers.forEach((m) => {
      const iconUrl = iconUrls[m.icon ?? "boy"];
      const icon = L.icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const marker = L.marker(m.position, { icon }).addTo(mapRef.current!);
      if (m.label) {
        marker.bindPopup(m.label);
      }
      markerRefs.current.push(marker);
    });
  }, [markers]);

  useEffect(() => {
    if (!mapRef.current) return;

    polyRefs.current.forEach((p) => p.remove());
    polyRefs.current = [];

    polylines.forEach((pl) => {
      const line = L.polyline(pl.points, {
        color: pl.color ?? "#FF7A00",
        weight: 3,
        opacity: 0.85,
        dashArray: pl.dash,
      }).addTo(mapRef.current!);
      polyRefs.current.push(line);
    });
  }, [polylines]);

  // isolation + relative contain Leaflet's high internal z-indexes (up to 1000)
  // so they never paint above app modals/drawers — fix for the QR-overlay bug.
  return <div ref={containerRef} className={`relative isolate overflow-hidden ${className}`} />;
}