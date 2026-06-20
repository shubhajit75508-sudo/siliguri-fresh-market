import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "SiliguriFreshMart/1.0" } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const road = addr.road ?? addr.street ?? addr.footway ?? addr.path ?? "";
    const neighbourhood = addr.neighbourhood ?? addr.suburb ?? addr.residential ?? addr.quarter ?? "";
    const building = addr.house_number
      ? `${addr.house_number}${road ? ` ${road}` : ""}`
      : road;
    const line = building || neighbourhood || addr.city_district || addr.town || addr.city || data.display_name;
    return NextResponse.json({
      display_name: line,
      address: {
        area: neighbourhood || addr.suburb || addr.city_district || addr.town || addr.county || "",
        landmark: road || addr.amenity || addr.leisure || "",
        building: addr.house_number || addr.building || "",
        city: addr.city || addr.town || addr.county || "",
        pincode: addr.postcode || "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
  }
}
