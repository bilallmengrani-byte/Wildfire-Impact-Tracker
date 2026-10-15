/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in miles
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2) ||
    !isFinite(lat1) ||
    !isFinite(lon1) ||
    !isFinite(lat2) ||
    !isFinite(lon2)
  ) {
    return 999999;
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const R = 3958.8; // Earth's mean radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats a distance in miles into a human-readable string.
 */
export function formatDistanceMiles(miles: number): string {
  if (typeof miles !== 'number' || isNaN(miles) || !isFinite(miles)) {
    return 'Distance unavailable';
  }
  if (miles < 1) {
    return `${(miles * 5280).toFixed(0)} ft away`;
  }
  if (miles < 10) {
    return `${miles.toFixed(1)} miles away`;
  }
  return `${Math.round(miles)} miles away`;
}

/**
 * Labels a geographic coordinate rounded to 2 decimal places.
 * Example: 45.82215, -73.26798 -> "45.82°N, 73.27°W"
 */
export function formatCoordinatesLabel(lat: number, lon: number): string {
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    isNaN(lat) ||
    isNaN(lon) ||
    !isFinite(lat) ||
    !isFinite(lon)
  ) {
    return 'Thermal Hotspot';
  }
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

