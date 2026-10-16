import { Request, Response } from 'express';
import { safeSendJson, safeSetHeader } from './response';

const NWS_USER_AGENT = 'WildfireImpactTracker/1.0 (student project, bilalmengrani6@gmail.com)';

interface WeatherCacheEntry {
  timestamp: number;
  data: WeatherDataResponse;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface WeatherDataResponse {
  available: boolean;
  message?: string;
  windSpeedMph?: number;
  windDirectionDeg?: number;
  windDirectionCardinal?: string;
  temperatureF?: number;
  temperatureC?: number;
  timestamp?: string;
  stationName?: string;
  stationId?: string;
}

const CARDINAL_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
];

function degreesToCardinal(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return CARDINAL_DIRECTIONS[index];
}

export async function getWeatherHandler(req: Request, res: Response): Promise<void> {
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

  // NWS prefers coordinates rounded to 4 decimals
  const roundedLat = lat.toFixed(4);
  const roundedLng = lng.toFixed(4);
  const cacheKey = `${roundedLat},${roundedLng}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    safeSetHeader(res, 'Cache-Control', 'public, max-age=300');
    safeSendJson(res, 200, cached.data);
    return;
  }

  try {
    const pointsUrl = `https://api.weather.gov/points/${roundedLat},${roundedLng}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const pointsRes = await fetch(pointsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': NWS_USER_AGENT,
        'Accept': 'application/geo+json, application/json',
      },
    });

    if (!pointsRes.ok) {
      clearTimeout(timeout);
      // NWS returns 404 if outside US coverage
      const notCoveredResponse: WeatherDataResponse = {
        available: false,
        message: 'Weather data not available for this location',
      };
      safeSendJson(res, 200, notCoveredResponse);
      return;
    }

    const pointsData = await pointsRes.json();
    const stationsUrl = pointsData?.properties?.observationStations;

    if (!stationsUrl) {
      clearTimeout(timeout);
      safeSendJson(res, 200, {
        available: false,
        message: 'Weather data not available for this location',
      });
      return;
    }

    // Call observation stations endpoint
    const stationsRes = await fetch(stationsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': NWS_USER_AGENT,
        'Accept': 'application/geo+json, application/json',
      },
    });

    if (!stationsRes.ok) {
      clearTimeout(timeout);
      safeSendJson(res, 200, {
        available: false,
        message: 'Weather data not available for this location',
      });
      return;
    }

    const stationsData = await stationsRes.json();
    const stations = stationsData?.features;

    if (!Array.isArray(stations) || stations.length === 0) {
      clearTimeout(timeout);
      safeSendJson(res, 200, {
        available: false,
        message: 'Weather data not available for this location',
      });
      return;
    }

    // Try the closest station (or iterate up to 2 if latest observation is null)
    let latestObservation: any = null;
    let stationName = stations[0]?.properties?.name || 'Local NWS Station';
    let stationId = stations[0]?.properties?.stationIdentifier || 'NWS';

    for (let i = 0; i < Math.min(stations.length, 2); i++) {
      const station = stations[i];
      const sId = station?.properties?.stationIdentifier;
      if (!sId) continue;

      const obsUrl = `https://api.weather.gov/stations/${sId}/observations/latest`;
      try {
        const obsRes = await fetch(obsUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': NWS_USER_AGENT,
            'Accept': 'application/geo+json, application/json',
          },
        });

        if (obsRes.ok) {
          const obsData = await obsRes.json();
          if (obsData?.properties) {
            latestObservation = obsData.properties;
            stationName = obsData.properties.stationName || station.properties.name || stationName;
            stationId = sId;
            break;
          }
        }
      } catch {
        // try next station
      }
    }

    clearTimeout(timeout);

    if (!latestObservation) {
      safeSendJson(res, 200, {
        available: false,
        message: 'Weather data not available for this location',
      });
      return;
    }

    // Extract wind speed, direction, temperature, timestamp
    const rawSpeed = latestObservation.windSpeed?.value;
    const speedUnit = latestObservation.windSpeed?.unitCode || '';
    let windSpeedMph: number | undefined;

    if (typeof rawSpeed === 'number' && !isNaN(rawSpeed)) {
      if (speedUnit.includes('km_h') || speedUnit.includes('km/h')) {
        windSpeedMph = Math.round(rawSpeed * 0.621371);
      } else if (speedUnit.includes('m_s') || speedUnit.includes('m/s')) {
        windSpeedMph = Math.round(rawSpeed * 2.23694);
      } else {
        windSpeedMph = Math.round(rawSpeed * 0.621371); // default assumption km/h in NWS
      }
    }

    const rawDir = latestObservation.windDirection?.value;
    let windDirectionDeg: number | undefined;
    let windDirectionCardinal: string | undefined;

    if (typeof rawDir === 'number' && !isNaN(rawDir)) {
      windDirectionDeg = Math.round(rawDir);
      windDirectionCardinal = degreesToCardinal(windDirectionDeg);
    }

    const rawTempC = latestObservation.temperature?.value;
    let temperatureF: number | undefined;
    let temperatureC: number | undefined;

    if (typeof rawTempC === 'number' && !isNaN(rawTempC)) {
      temperatureC = Math.round(rawTempC * 10) / 10;
      temperatureF = Math.round((rawTempC * 9) / 5 + 32);
    }

    const rawTimestamp = latestObservation.timestamp;

    const weatherResult: WeatherDataResponse = {
      available: true,
      windSpeedMph,
      windDirectionDeg,
      windDirectionCardinal,
      temperatureF,
      temperatureC,
      timestamp: rawTimestamp || new Date().toISOString(),
      stationName,
      stationId,
    };

    // Cache valid result
    weatherCache.set(cacheKey, {
      timestamp: Date.now(),
      data: weatherResult,
    });

    safeSetHeader(res, 'Cache-Control', 'public, max-age=300');
    safeSendJson(res, 200, weatherResult);
  } catch (err: any) {
    console.warn('NWS API error:', err.message);
    safeSendJson(res, 200, {
      available: false,
      message: 'Weather data not available for this location',
    });
  }
}
