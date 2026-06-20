import { NextRequest, NextResponse } from "next/server";

async function reverseGeocode(lat: string, lng: string, zoom: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=en`;
  const res = await fetch(url, { headers: { "User-Agent": "SiliguriFreshMart/1.0" } });
  if (!res.ok) return null;
  return res.json();
}

function pick(...vals: (string | undefined | null)[]): string {
  return vals.find((v) => v && v.trim()) ?? "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }
  try {
    let data = await reverseGeocode(lat, lng, 17);
    if (!data?.address) data = await reverseGeocode(lat, lng, 16);
    if (!data?.address) data = await reverseGeocode(lat, lng, 14);

    const a = (data?.address ?? {}) as Record<string, string>;

    const place = pick(a.neighbourhood, a.suburb, a.hamlet, a.village, a.residential, a.quarter);
    const road = pick(a.road, a.street, a.pedestrian, a.footway);
    const town = pick(a.town, a.city_district, a.city, a.municipality);
    const landmarkTag = pick(a.amenity, a.leisure, a.tourism, a.shop, a.office, a.public_building);

    const houseNo = a.house_number || "";
    const buildingName = a.building || a.house_name || "";

    const area = place || road || "";

    const building = houseNo
      ? houseNo + (road ? `, ${road}` : "")
      : buildingName || "";

    const landmark = landmarkTag || (place ? "" : road) || "";

    const city = town || "";

    const pincode = a.postcode || "";

    const lineParts = [houseNo ? `#${houseNo}` : "", road, place, town].filter(Boolean);
    const line = lineParts.length > 0 ? lineParts.join(", ") : data?.display_name ?? "";

    return NextResponse.json({
      display_name: line,
      address: {
        area: area || "",
        landmark,
        building,
        city,
        pincode,
      },
    });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
  }
}
