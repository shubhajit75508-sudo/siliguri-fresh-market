"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveMapProps {
  center: [number, number];
  zoom?: number;
  markers?: {
    position: [number, number];
    icon?: "boy" | "customer" | "store";
    label?: string;
  }[];
  className?: string;
}

const iconUrls = {
  boy: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  customer: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  store: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
};

export default function LiveMap({ center, zoom = 14, markers = [], className = "h-80 w-full rounded-2xl" }: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<L.Marker[]>([]);

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

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRefs.current = [];
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

    const defaultIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

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

  return <div ref={containerRef} className={className} />;
}
