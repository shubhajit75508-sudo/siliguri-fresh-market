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
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
      { headers: { "User-Agent": "SiliguriFreshMart/1.0" } }
    );
    const data = await res.json();
    const a = data.address ?? {};

    const road = a.road ?? a.street ?? a.pedestrian ?? a.footway ?? a.path ?? "";

    const areaLocal =
      a.neighbourhood ?? a.suburb ?? a.hamlet ?? a.village ?? a.residential ?? a.quarter ?? a.allotments ?? "";

    const areaFallback = a.city_district ?? a.town ?? a.borough ?? "";

    const area = areaLocal || areaFallback || road || "";

    const landmark =
      a.amenity ?? a.leisure ?? a.tourism ?? a.shop ?? a.office ?? a.industrial ?? a.commercial ?? "";

    const building =
      a.house_number
        ? a.house_number + (road ? `, ${road}` : "")
        : a.building ?? a.house_name ?? road;

    const city = a.city ?? a.town ?? a.municipality ?? "";

    const pincode = a.postcode ?? "";

    const line = [building, area].filter(Boolean).join(", ") || data.display_name;

    return NextResponse.json({
      display_name: line,
      address: { area, landmark, building, city, pincode },
    });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
  }
}
