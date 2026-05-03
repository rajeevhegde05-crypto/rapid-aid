// Geolocation + Overpass API for nearby emergency facilities

export interface Facility {
  name: string;
  type: "police" | "fire" | "hospital";
  lat: number;
  lon: number;
  distance: number; // km
  phone?: string;
}

/**
 * Get current GPS position.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  });
}

/**
 * Calculate distance between two coordinates (Haversine formula).
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Query Overpass API for nearby emergency facilities.
 */
export async function findNearbyFacilities(lat: number, lon: number, radiusKm: number = 5): Promise<Facility[]> {
  const radiusM = radiusKm * 1000;

  // Overpass QL query for police, fire, hospitals
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["amenity"="police"](around:${radiusM},${lat},${lon});
      node["amenity"="fire_station"](around:${radiusM},${lat},${lon});
      node["amenity"="hospital"](around:${radiusM},${lat},${lon});
      way["amenity"="police"](around:${radiusM},${lat},${lon});
      way["amenity"="fire_station"](around:${radiusM},${lat},${lon});
      way["amenity"="hospital"](around:${radiusM},${lat},${lon});
    );
    out center body;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(overpassQuery)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const data = await res.json();

  const facilities: Facility[] = data.elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;

      const amenity = el.tags?.amenity;
      let type: Facility["type"];
      if (amenity === "police") type = "police";
      else if (amenity === "fire_station") type = "fire";
      else if (amenity === "hospital") type = "hospital";
      else return null;

      return {
        name: el.tags?.name || (type === "police" ? "Police Station" : type === "fire" ? "Fire Station" : "Hospital"),
        type,
        lat: elLat,
        lon: elLon,
        distance: haversine(lat, lon, elLat, elLon),
        phone: el.tags?.phone || el.tags?.["contact:phone"] || undefined,
      } as Facility;
    })
    .filter(Boolean) as Facility[];

  // Sort by distance
  facilities.sort((a, b) => a.distance - b.distance);

  // Return top 6
  return facilities.slice(0, 6);
}
