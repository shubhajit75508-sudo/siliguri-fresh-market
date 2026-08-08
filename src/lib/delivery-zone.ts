export const DELIVERY_ZONE_LABEL = "Laketown / Gate Bazar, Siliguri";

export const STORE_LOCATION = {
  lat: Number(process.env.DELIVERY_STORE_LAT) || 26.692472,
  lng: Number(process.env.DELIVERY_STORE_LNG) || 88.422583,
};

export const DELIVERY_RADIUS_KM = Number(process.env.DELIVERY_RADIUS_KM) || 8;

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
