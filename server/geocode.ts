import { Request, Response } from 'express';
import { safeSendJson, safeSetHeader } from './response';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

export async function geocodeHandler(req: Request, res: Response): Promise<void> {
  const query = req.query.q as string;

  if (!query || !query.trim()) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }

  const trimmed = query.trim();
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed
  )}&format=json&addressdetails=1&limit=5&countrycodes=us`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WildfireImpactTracker/1.0 (bilalmengrani6@gmail.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Geocoding service returned status ${response.status}`,
      });
      return;
    }

    const data = (await response.json()) as NominatimResult[];

    const results = data
      .map((item) => {
        // Craft a short, clean name and secondary label
        const nameParts = item.display_name.split(',');
        const shortName = item.name || nameParts[0]?.trim() || trimmed;
        const state = item.address?.state || nameParts[1]?.trim() || '';
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        return {
          id: String(item.place_id),
          name: shortName,
          displayName: item.display_name,
          state: state,
          lat,
          lng,
          type: item.type || 'place',
        };
      })
      .filter((r) => !isNaN(r.lat) && !isNaN(r.lng) && isFinite(r.lat) && isFinite(r.lng));

    safeSetHeader(res, 'Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
    safeSendJson(res, 200, results);
  } catch (err: any) {
    console.warn('Geocoding fetch error:', err.message);
    safeSendJson(res, 200, []);
  }
}
