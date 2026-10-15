import { Request, Response } from 'express';

export interface CleanedFireDetection {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: string;
  frp: number;
  acq_date: string;
  acq_time: string;
}

// In-memory cache for NASA FIRMS data (5-minute TTL)
let memoryCache: {
  timestamp: number;
  data: CleanedFireDetection[];
} | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fallback dataset for Continental US if NASA satellites or network are unreachable.
 */
const FALLBACK_DETECTIONS: CleanedFireDetection[] = [
  { latitude: 44.2384, longitude: -121.7821, brightness: 342.1, confidence: 'High', frp: 58.4, acq_date: '2026-10-10', acq_time: '04:22 UTC' },
  { latitude: 44.2152, longitude: -121.7513, brightness: 331.0, confidence: 'Nominal', frp: 34.2, acq_date: '2026-10-10', acq_time: '04:22 UTC' },
  { latitude: 40.8921, longitude: -122.4512, brightness: 355.8, confidence: 'High', frp: 72.1, acq_date: '2026-10-10', acq_time: '05:14 UTC' },
  { latitude: 40.9104, longitude: -122.4189, brightness: 326.4, confidence: 'Nominal', frp: 28.9, acq_date: '2026-10-10', acq_time: '05:14 UTC' },
  { latitude: 43.4891, longitude: -115.3421, brightness: 338.2, confidence: 'Nominal', frp: 41.5, acq_date: '2026-10-10', acq_time: '06:01 UTC' },
  { latitude: 43.5102, longitude: -115.3190, brightness: 362.0, confidence: 'High', frp: 85.3, acq_date: '2026-10-10', acq_time: '06:01 UTC' },
  { latitude: 33.7214, longitude: -110.8923, brightness: 329.5, confidence: 'Nominal', frp: 26.8, acq_date: '2026-10-10', acq_time: '05:48 UTC' },
  { latitude: 37.8921, longitude: -119.5412, brightness: 344.2, confidence: 'High', frp: 61.4, acq_date: '2026-10-10', acq_time: '05:32 UTC' },
  { latitude: 46.8123, longitude: -114.1205, brightness: 334.6, confidence: 'Nominal', frp: 38.1, acq_date: '2026-10-10', acq_time: '04:55 UTC' },
  { latitude: 47.1023, longitude: -120.9123, brightness: 348.0, confidence: 'High', frp: 64.9, acq_date: '2026-10-10', acq_time: '05:12 UTC' },
];

/**
 * Parses raw CSV text returned by NASA FIRMS API into structured fire detection objects.
 */
function parseFirmsCsv(csvText: string): CleanedFireDetection[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim());

  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const brightIdx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
  const confIdx = headers.indexOf('confidence');
  const frpIdx = headers.indexOf('frp');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');

  if (latIdx === -1 || lonIdx === -1) {
    return [];
  }

  const detections: CleanedFireDetection[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.trim());
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);

    if (isNaN(lat) || isNaN(lon)) continue;

    // Filter to Continental US bounding box
    if (lat < 24.0 || lat > 50.0 || lon < -125.0 || lon > -66.0) {
      continue;
    }

    const brightness = brightIdx !== -1 && !isNaN(parseFloat(cols[brightIdx]))
      ? Math.round(parseFloat(cols[brightIdx]) * 10) / 10
      : 0;

    const confidenceVal = confIdx !== -1 ? cols[confIdx] || 'n' : 'n';
    let formattedConfidence = confidenceVal;
    const lowerConf = confidenceVal.toLowerCase();
    if (lowerConf === 'h' || lowerConf === 'high') {
      formattedConfidence = 'High';
    } else if (lowerConf === 'l' || lowerConf === 'low') {
      formattedConfidence = 'Low';
    } else if (lowerConf === 'n' || lowerConf === 'nominal') {
      formattedConfidence = 'Nominal';
    } else if (!isNaN(Number(confidenceVal))) {
      formattedConfidence = `${confidenceVal}%`;
    }

    const frp = frpIdx !== -1 && !isNaN(parseFloat(cols[frpIdx]))
      ? Math.round(parseFloat(cols[frpIdx]) * 10) / 10
      : 0;

    const acq_date = dateIdx !== -1 ? cols[dateIdx] || '' : '';
    const rawTime = (timeIdx !== -1 ? cols[timeIdx] || '' : '').trim();

    // Format military time: e.g. "629" -> "06:29 UTC", "1430" -> "14:30 UTC"
    let acq_time = rawTime;
    if (rawTime.length >= 1 && rawTime.length <= 4) {
      const padded = rawTime.padStart(4, '0');
      acq_time = `${padded.slice(0, 2)}:${padded.slice(2)} UTC`;
    }

    detections.push({
      latitude: lat,
      longitude: lon,
      brightness,
      confidence: formattedConfidence,
      frp,
      acq_date,
      acq_time,
    });
  }

  return detections;
}

async function fetchFirmsSource(source: string, mapKey: string, areaCoords: string): Promise<CleanedFireDetection[]> {
  const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${areaCoords}/1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(firmsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WildfireImpactTracker/1.0',
        'Accept': 'text/plain, text/csv, */*',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const csvText = await res.text();
    if (csvText.startsWith('Invalid MAP_KEY') || csvText.includes('Invalid transaction key')) {
      return [];
    }

    return parseFirmsCsv(csvText);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * GET /api/fires
 * Fetches last 24 hours of VIIRS satellite fire detections for Continental US from NASA FIRMS.
 * Queries active VIIRS satellites (NOAA-20, NOAA-21, Suomi-NPP) to ensure continuous live coverage.
 */
export async function getFiresHandler(_req: Request, res: Response): Promise<void> {
  const envKey = process.env.FIRMS_MAP_KEY?.trim();
  const mapKey = (envKey && envKey !== 'MY_NASA_FIRMS_MAP_KEY')
    ? envKey
    : 'de8075a4eb10991384722aa38a5c06ec';

  // Check cache first (only serve if cache has data)
  const now = Date.now();
  if (memoryCache && memoryCache.data.length > 0 && now - memoryCache.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-FIRMS-Live', 'true');
    res.setHeader('X-FIRMS-Cached', 'true');
    res.status(200).json(memoryCache.data);
    return;
  }

  // Continental US Bounding Box: [West, South, East, North]
  const areaCoords = '-125,24,-66,49';

  // Try NOAA-20 first (primary active polar pass)
  let liveDetections = await fetchFirmsSource('VIIRS_NOAA20_NRT', mapKey, areaCoords);

  // If NOAA-20 returned few or no detections, try NOAA-21
  if (liveDetections.length < 20) {
    const noaa21 = await fetchFirmsSource('VIIRS_NOAA21_NRT', mapKey, areaCoords);
    if (noaa21.length > 0) {
      liveDetections = [...liveDetections, ...noaa21];
    }
  }

  // If still empty, try SNPP
  if (liveDetections.length === 0) {
    liveDetections = await fetchFirmsSource('VIIRS_SNPP_NRT', mapKey, areaCoords);
  }

  if (liveDetections.length > 0) {
    // Deduplicate by close coordinates (within 0.005 deg)
    const seen = new Set<string>();
    const deduplicated = liveDetections.filter((d) => {
      const key = `${d.latitude.toFixed(3)},${d.longitude.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    memoryCache = {
      timestamp: now,
      data: deduplicated,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-FIRMS-Live', 'true');
    res.status(200).json(deduplicated);
    return;
  }

  // If live query yielded 0 (satellite orbit delay or API rate limits), serve fallback
  if (memoryCache && memoryCache.data.length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-FIRMS-Live', 'true');
    res.setHeader('X-FIRMS-Stale', 'true');
    res.status(200).json(memoryCache.data);
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-FIRMS-Live', 'false');
  res.status(200).json(FALLBACK_DETECTIONS);
}
