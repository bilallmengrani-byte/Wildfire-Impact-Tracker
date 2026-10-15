import { FireDetection, SelectedPlace, WeatherData } from './types';
import { calculateDistanceMiles } from './distance';

/**
 * PROTOTYPE IMPACT INDEX SCORING MODEL
 * --------------------------------------
 * Total Max Score: 100 points
 *
 * FACTOR WEIGHT BREAKDOWN:
 * 1. Proximity (up to 40 pts):
 *    - Closest fire detection within 150 miles.
 *    - Points scale inversely with distance to the selected place.
 *    - 0-10 miles: 40 pts
 *    - 11-30 miles: 32 pts
 *    - 31-60 miles: 24 pts
 *    - 61-100 miles: 14 pts
 *    - 101-150 miles: 6 pts
 *    - >150 miles / no detections: 0 pts
 *
 * 2. Recency (up to 25 pts):
 *    - How recently the nearest cluster or hotspot was detected by satellite sensors.
 *    - <= 2 hours ago: 25 pts
 *    - 2 to 6 hours ago: 18 pts
 *    - 6 to 12 hours ago: 10 pts
 *    - 12 to 24 hours ago: 4 pts
 *    - >24 hours or missing time: 0 pts
 *
 * 3. Persistence (up to 15 pts):
 *    - Detections appearing across multiple distinct satellite observation time windows nearby (<150 mi).
 *    - Indicates sustained or recurring thermal activity rather than a single brief flare-up.
 *    - >= 4 distinct time windows: 15 pts
 *    - 2-3 distinct time windows: 10 pts
 *    - 1 time window: 4 pts
 *    - 0 detections: 0 pts
 *
 * 4. Wind Alignment (up to 20 pts):
 *    - Uses spherical bearing trigonometry to evaluate if wind vectors blow from the fire toward the location.
 *    - Wind blowing towards target within 30 deg: 20 pts (direct downwind)
 *    - Within 31-60 deg: 12 pts (partial alignment)
 *    - Within 61-90 deg: 5 pts (crosswind influence)
 *    - >90 deg: 0 pts (upwind, blowing away)
 *    - If NWS wind data is unavailable: 0 pts, flagged as "data unavailable" (never guessed)
 */

export interface ImpactFactor {
  name: string;
  value: string;
  contribution: number;
  maxPoints: number;
  description: string;
  dataUnavailable?: boolean;
}

export interface ImpactIndexResult {
  score: number;
  level: 'low' | 'moderate' | 'high';
  color: 'emerald' | 'amber' | 'red';
  factors: ImpactFactor[];
}

/**
 * Calculates initial spherical bearing from point A to point B in degrees (0-360).
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * Computes angular difference between two compass bearings (0-180 deg).
 */
function angularDifference(deg1: number, deg2: number): number {
  const diff = Math.abs(deg1 - deg2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Parses detection timestamp to estimate approximate elapsed hours.
 */
function getElapsedHours(detection: FireDetection): number | null {
  if (!detection.acq_date) return null;

  // Clean acq_time (e.g. "03:42 UTC" or "0342")
  const timeDigits = detection.acq_time.replace(/[^0-9]/g, '');
  let hours = 12;
  let mins = 0;

  if (timeDigits.length >= 3) {
    const padded = timeDigits.padStart(4, '0');
    hours = parseInt(padded.slice(0, 2), 10);
    mins = parseInt(padded.slice(2, 4), 10);
  }

  try {
    const [y, m, d] = detection.acq_date.split('-').map(Number);
    if (!y || !m || !d) return null;

    const detDate = new Date(Date.UTC(y, m - 1, d, hours, mins));
    const now = new Date();
    const diffMs = now.getTime() - detDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // If diff is negative (due to timezone clock skew), clamp to 0.5
    return Math.max(0.2, diffHours);
  } catch {
    return null;
  }
}

/**
 * Evaluates the Prototype Impact Index for a selected place.
 */
export function calculateImpactIndex(
  detections: FireDetection[],
  weatherData: WeatherData | null,
  selectedPlace: SelectedPlace | null
): ImpactIndexResult {
  const factors: ImpactFactor[] = [];

  // Default empty result if no place selected
  if (!selectedPlace) {
    return {
      score: 0,
      level: 'low',
      color: 'emerald',
      factors: [
        {
          name: 'Proximity',
          value: 'No place selected',
          contribution: 0,
          maxPoints: 40,
          description: 'Select a location on the map to evaluate nearby fire proximity.',
          dataUnavailable: true,
        },
        {
          name: 'Recency',
          value: 'No place selected',
          contribution: 0,
          maxPoints: 25,
          description: 'Evaluates elapsed time since the latest thermal detection.',
          dataUnavailable: true,
        },
        {
          name: 'Persistence',
          value: 'No place selected',
          contribution: 0,
          maxPoints: 15,
          description: 'Counts distinct satellite observation sweeps detecting heat.',
          dataUnavailable: true,
        },
        {
          name: 'Wind Alignment',
          value: 'No place selected',
          contribution: 0,
          maxPoints: 20,
          description: 'Calculates if wind vectors transport smoke toward the location.',
          dataUnavailable: true,
        },
      ],
    };
  }

  // Find all detections within 150 miles
  const nearbyDetections = detections
    .filter((d) => d.isWithinRange)
    .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999));

  const nearestFire = nearbyDetections.length > 0 ? nearbyDetections[0] : null;

  // 1. PROXIMITY FACTOR (Max 40 points)
  let proximityScore = 0;
  let proximityValue = 'None within 150 mi';
  let proximityDesc = 'No active thermal detections detected within the 150-mile radius buffer.';

  if (nearestFire && nearestFire.distanceMiles !== undefined) {
    const dist = nearestFire.distanceMiles;
    if (dist <= 10) {
      proximityScore = 40;
      proximityValue = `${dist.toFixed(1)} miles away`;
      proximityDesc = `Critical proximity: nearest active thermal detection is within 10 miles.`;
    } else if (dist <= 30) {
      proximityScore = 32;
      proximityValue = `${dist.toFixed(1)} miles away`;
      proximityDesc = `Close proximity: active detection located within 30 miles of the community.`;
    } else if (dist <= 60) {
      proximityScore = 24;
      proximityValue = `${dist.toFixed(1)} miles away`;
      proximityDesc = `Moderate proximity: nearest detection is between 30 and 60 miles away.`;
    } else if (dist <= 100) {
      proximityScore = 14;
      proximityValue = `${dist.toFixed(1)} miles away`;
      proximityDesc = `Extended proximity: fire detection is 60–100 miles away.`;
    } else {
      proximityScore = 6;
      proximityValue = `${dist.toFixed(1)} miles away`;
      proximityDesc = `Distant hotspot: detected on outer perimeter (100–150 miles away).`;
    }
  }

  factors.push({
    name: 'Proximity',
    value: proximityValue,
    contribution: proximityScore,
    maxPoints: 40,
    description: proximityDesc,
  });

  // 2. RECENCY FACTOR (Max 25 points)
  let recencyScore = 0;
  let recencyValue = 'No recent detections';
  let recencyDesc = 'No satellite detections in range to gauge recency.';
  let recencyUnavailable = false;

  if (nearestFire) {
    const elapsed = getElapsedHours(nearestFire);
    if (elapsed !== null) {
      if (elapsed <= 2) {
        recencyScore = 25;
        recencyValue = `Observed ~${elapsed.toFixed(1)}h ago`;
        recencyDesc = `Immediate recency: satellite sensor detected heat anomaly in the last 2 hours.`;
      } else if (elapsed <= 6) {
        recencyScore = 18;
        recencyValue = `Observed ~${elapsed.toFixed(1)}h ago`;
        recencyDesc = `High recency: active cluster confirmed within the last 6 hours.`;
      } else if (elapsed <= 12) {
        recencyScore = 10;
        recencyValue = `Observed ~${elapsed.toFixed(1)}h ago`;
        recencyDesc = `Moderate recency: detection captured within the last 12 hours.`;
      } else if (elapsed <= 24) {
        recencyScore = 4;
        recencyValue = `Observed ~${elapsed.toFixed(1)}h ago`;
        recencyDesc = `Older detection: observed between 12 and 24 hours ago.`;
      } else {
        recencyScore = 0;
        recencyValue = `Observed >24h ago`;
        recencyDesc = `Detection exceeds 24-hour observation window.`;
      }
    } else {
      recencyScore = 0;
      recencyValue = 'Time data unavailable';
      recencyDesc = 'Observation timestamp format could not be verified.';
      recencyUnavailable = true;
    }
  }

  factors.push({
    name: 'Recency',
    value: recencyValue,
    contribution: recencyScore,
    maxPoints: 25,
    description: recencyDesc,
    dataUnavailable: recencyUnavailable,
  });

  // 3. PERSISTENCE FACTOR (Max 15 points)
  let persistenceScore = 0;
  let persistenceValue = '0 time windows';
  let persistenceDesc = 'No persistent thermal cluster detected in 150-mile buffer.';

  if (nearbyDetections.length > 0) {
    const uniqueTimes = new Set(nearbyDetections.map((d) => d.acq_time.slice(0, 5)));
    const windowCount = uniqueTimes.size;

    if (windowCount >= 4) {
      persistenceScore = 15;
      persistenceValue = `${windowCount} observation sweeps`;
      persistenceDesc = `Strong persistence: detected across ${windowCount} distinct satellite sweeps, indicating ongoing activity.`;
    } else if (windowCount >= 2) {
      persistenceScore = 10;
      persistenceValue = `${windowCount} observation sweeps`;
      persistenceDesc = `Moderate persistence: detected across ${windowCount} distinct satellite passes.`;
    } else {
      persistenceScore = 4;
      persistenceValue = `Single satellite pass`;
      persistenceDesc = `Single observation window recorded so far.`;
    }
  }

  factors.push({
    name: 'Persistence',
    value: persistenceValue,
    contribution: persistenceScore,
    maxPoints: 15,
    description: persistenceDesc,
  });

  // 4. WIND ALIGNMENT FACTOR (Max 20 points)
  let windScore = 0;
  let windValue = 'Data unavailable';
  let windDesc = 'NWS wind data unavailable for this location — no wind points assigned.';
  let windUnavailable = false;

  if (
    !weatherData ||
    !weatherData.available ||
    weatherData.windDirectionDeg === undefined ||
    weatherData.windSpeedMph === undefined
  ) {
    // Exact requirement: "0 pts if wind data unavailable — never assume"
    windScore = 0;
    windValue = 'NWS data unavailable';
    windDesc = 'National Weather Service wind vector unavailable for this coordinate — wind alignment not estimated.';
    windUnavailable = true;
  } else if (!nearestFire) {
    windScore = 0;
    windValue = `${weatherData.windSpeedMph} mph from ${weatherData.windDirectionCardinal || 'N/A'}`;
    windDesc = 'No fires in 150-mile buffer to evaluate downwind smoke transport.';
  } else {
    // Meteorological windDirectionDeg is where wind comes FROM.
    // Direction the wind is blowing towards is (windDirectionDeg + 180) % 360
    const windBlowingTowards = (weatherData.windDirectionDeg + 180) % 360;

    // Bearing from the fire toward the selected place
    const bearingFireToPlace = calculateBearing(
      nearestFire.latitude,
      nearestFire.longitude,
      selectedPlace.lat,
      selectedPlace.lng
    );

    const angleDiff = angularDifference(windBlowingTowards, bearingFireToPlace);

    if (weatherData.windSpeedMph < 3) {
      windScore = 3;
      windValue = `Light winds (${weatherData.windSpeedMph} mph)`;
      windDesc = `Very light/calm winds observed. Smoke dispersion is localized with minimal transport.`;
    } else if (angleDiff <= 30) {
      windScore = 20;
      windValue = `Aligned downwind (Δ${Math.round(angleDiff)}°)`;
      windDesc = `Direct downwind alignment: winds (${weatherData.windSpeedMph} mph from ${weatherData.windDirectionCardinal}) blow directly toward the selected place.`;
    } else if (angleDiff <= 60) {
      windScore = 12;
      windValue = `Partially aligned (Δ${Math.round(angleDiff)}°)`;
      windDesc = `Partial downwind alignment: winds could carry smoke plume toward the area.`;
    } else if (angleDiff <= 90) {
      windScore = 5;
      windValue = `Crosswind (Δ${Math.round(angleDiff)}°)`;
      windDesc = `Crosswind trajectory: smoke plume likely moves adjacent to the community.`;
    } else {
      windScore = 0;
      windValue = `Upwind / Away (Δ${Math.round(angleDiff)}°)`;
      windDesc = `Favorable trajectory: winds blow away from the selected location.`;
    }
  }

  factors.push({
    name: 'Wind Alignment',
    value: windValue,
    contribution: windScore,
    maxPoints: 20,
    description: windDesc,
    dataUnavailable: windUnavailable,
  });

  // Calculate total score (clamped between 0 and 100)
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      factors.reduce((sum, f) => sum + f.contribution, 0)
    )
  );

  let level: 'low' | 'moderate' | 'high' = 'low';
  let color: 'emerald' | 'amber' | 'red' = 'emerald';

  if (totalScore >= 61) {
    level = 'high';
    color = 'red';
  } else if (totalScore >= 31) {
    level = 'moderate';
    color = 'amber';
  } else {
    level = 'low';
    color = 'emerald';
  }

  return {
    score: totalScore,
    level,
    color,
    factors,
  };
}
