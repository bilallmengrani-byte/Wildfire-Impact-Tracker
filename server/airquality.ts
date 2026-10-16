import { Request, Response } from 'express';
import { safeSendJson, safeSetHeader } from './response';

interface AirNowObservation {
  DateObserved: string;
  HourObserved: number;
  LocalTimeZone: string;
  ReportingArea: string;
  StateCode: string;
  Latitude: number;
  Longitude: number;
  ParameterName: string;
  AQI: number;
  Category: {
    Number: number;
    Name: string;
  };
}

export interface AirQualityResponse {
  available: boolean;
  message?: string;
  aqi?: number;
  category?: string;
  categoryNumber?: number;
  primaryPollutant?: string;
  stationName?: string;
  stationDistanceMiles?: number;
  observationTimestamp?: string;
}

// Haversine formula helper for station distance in miles
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 15-minute in-memory cache
const aqiCache = new Map<string, { timestamp: number; data: AirQualityResponse }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getAirQualityHandler(req: Request, res: Response): Promise<void> {
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    safeSendJson(res, 400, {
      available: false,
      message: 'Valid latitude and longitude are required.',
    });
    return;
  }

  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = aqiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    safeSetHeader(res, 'Cache-Control', 'public, max-age=600');
    safeSendJson(res, 200, cached.data);
    return;
  }

  const apiKey = process.env.AIRNOW_API_KEY?.trim();

  // If AirNow API key is not configured, gracefully return unavailable as required
  if (!apiKey || apiKey === 'MY_AIRNOW_API_KEY') {
    const unavailableResponse: AirQualityResponse = {
      available: false,
      message: 'No nearby air quality station — check AirNow.gov directly',
    };
    safeSendJson(res, 200, unavailableResponse);
    return;
  }

  // AirNow current observations by lat/long (distance within 50 miles)
  const airNowUrl = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lng}&distance=50&API_KEY=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(airNowUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      safeSendJson(res, 200, {
        available: false,
        message: 'No nearby air quality station — check AirNow.gov directly',
      });
      return;
    }

    const data = (await response.json()) as AirNowObservation[];

    if (!Array.isArray(data) || data.length === 0) {
      safeSendJson(res, 200, {
        available: false,
        message: 'No nearby air quality station — check AirNow.gov directly',
      });
      return;
    }

    // Filter to valid observations and check distance <= 50 miles
    const validObservations = data.filter((obs) => {
      if (typeof obs.Latitude !== 'number' || typeof obs.Longitude !== 'number') return false;
      const distance = calculateDistanceMiles(lat, lng, obs.Latitude, obs.Longitude);
      return distance <= 50;
    });

    if (validObservations.length === 0) {
      safeSendJson(res, 200, {
        available: false,
        message: 'No nearby air quality station — check AirNow.gov directly',
      });
      return;
    }

    // Pick observation with highest AQI (dominant risk indicator, typically PM2.5 or Ozone)
    validObservations.sort((a, b) => (b.AQI || 0) - (a.AQI || 0));
    const topObs = validObservations[0];

    // Check staleness: if observation is >3 hours old
    let isStale = false;
    try {
      const dateStr = topObs.DateObserved.trim(); // YYYY-MM-DD
      const hour = topObs.HourObserved; // 0-23
      // Approximate ISO date string
      const [year, month, day] = dateStr.split('-').map(Number);
      const obsDate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
      const now = new Date();
      const diffHours = (now.getTime() - obsDate.getTime()) / (1000 * 60 * 60);

      // If observation is more than 3.5 hours old
      if (diffHours > 3.5) {
        isStale = true;
      }
    } catch {
      // If date parsing fails, do not assume stale unless abnormal
    }

    if (isStale) {
      safeSendJson(res, 200, {
        available: false,
        message: 'No nearby air quality station — check AirNow.gov directly',
      });
      return;
    }

    const distanceMiles = Math.round(
      calculateDistanceMiles(lat, lng, topObs.Latitude, topObs.Longitude) * 10
    ) / 10;

    const formattedTimestamp = `${topObs.DateObserved.trim()} at ${String(
      topObs.HourObserved
    ).padStart(2, '0')}:00 ${topObs.LocalTimeZone}`;

    const stationLabel = topObs.StateCode
      ? `${topObs.ReportingArea}, ${topObs.StateCode}`
      : topObs.ReportingArea;

    const result: AirQualityResponse = {
      available: true,
      aqi: topObs.AQI,
      category: topObs.Category?.Name || 'Moderate',
      categoryNumber: topObs.Category?.Number || 1,
      primaryPollutant: topObs.ParameterName || 'PM2.5',
      stationName: stationLabel,
      stationDistanceMiles: distanceMiles,
      observationTimestamp: formattedTimestamp,
    };

    aqiCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result,
    });

    safeSetHeader(res, 'Cache-Control', 'public, max-age=600');
    safeSendJson(res, 200, result);
  } catch (err: any) {
    console.warn('AirNow fetch error:', err.message);
    safeSendJson(res, 200, {
      available: false,
      message: 'No nearby air quality station — check AirNow.gov directly',
    });
  }
}
