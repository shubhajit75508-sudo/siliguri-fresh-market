export const DELIVERY_ZONE_LABEL = "NJP Gate Bazar, Siliguri";

export const STORE_LOCATION = {
  lat: Number(process.env.DELIVERY_STORE_LAT) || 26.692472,
  lng: Number(process.env.DELIVERY_STORE_LNG) || 88.422583,
};

export const DELIVERY_RADIUS_KM = Number(process.env.DELIVERY_RADIUS_KM) || 20;

export interface DeliveryTier {
  maxKm: number;
  eta: string;
  minOrder: number;
  deliveryFee: number;
  label: string;
}

export const DELIVERY_TIERS: DeliveryTier[] = [
  { maxKm: 1, eta: "10-20 min", minOrder: 0, deliveryFee: 0, label: "Within 1 km" },
  { maxKm: 4, eta: "20-30 min", minOrder: 0, deliveryFee: 0, label: "Within 4 km" },
  { maxKm: 8, eta: "45-60 min", minOrder: 0, deliveryFee: 0, label: "Within 8 km" },
  { maxKm: 15, eta: "1.5-2 hrs", minOrder: 1499, deliveryFee: 79, label: "8-15 km" },
  { maxKm: 20, eta: "2-3 hrs", minOrder: 1999, deliveryFee: 99, label: "15-20 km" },
];

export interface DeliverySlot {
  id: string;
  label: string;
  description: string;
  orderBefore: string;
  deliveryWindow: string;
}

export const DELIVERY_SLOTS: DeliverySlot[] = [
  {
    id: "morning",
    label: "Morning Slot",
    description: "Order before 10 AM",
    orderBefore: "10:00 AM",
    deliveryWindow: "11:00 AM - 12:00 PM",
  },
  {
    id: "afternoon",
    label: "Afternoon Slot",
    description: "Order before 12 PM",
    orderBefore: "12:00 PM",
    deliveryWindow: "1:00 PM - 3:00 PM",
  },
];

export function getCurrentSlot(): DeliverySlot {
  const now = new Date();
  const hours = now.getHours();
  if (hours < 12) return DELIVERY_SLOTS[0];
  return DELIVERY_SLOTS[1];
}

export function getNextSlot(): DeliverySlot {
  const now = new Date();
  const hours = now.getHours();
  if (hours < 12) return DELIVERY_SLOTS[1];
  return DELIVERY_SLOTS[0];
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceFromStore(lat: number, lng: number): number {
  return haversineKm(lat, lng, STORE_LOCATION.lat, STORE_LOCATION.lng);
}

export function isWithinDeliveryZone(lat: number, lng: number): boolean {
  return distanceFromStore(lat, lng) <= DELIVERY_RADIUS_KM;
}

export function getDeliveryTier(distanceKm: number): DeliveryTier {
  for (const tier of DELIVERY_TIERS) {
    if (distanceKm <= tier.maxKm) return tier;
  }
  return DELIVERY_TIERS[DELIVERY_TIERS.length - 1];
}

export function getDeliveryFeeForDistance(distanceKm: number, subtotal: number): number {
  const tier = getDeliveryTier(distanceKm);
  if (tier.minOrder === 0) {
    if (subtotal < 99) return 59;
    if (subtotal < 299) return 40;
    return 0;
  }
  return subtotal >= tier.minOrder ? 0 : tier.deliveryFee;
}

export function getMinOrderForDistance(distanceKm: number): number {
  return getDeliveryTier(distanceKm).minOrder;
}

export function getEtaForDistance(distanceKm: number): string {
  return getDeliveryTier(distanceKm).eta;
}
