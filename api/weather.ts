import type { Request, Response } from 'express';
import { getWeatherHandler } from '../server/weather';

export default async function handler(req: Request | any, res: Response | any) {
  try {
    return await getWeatherHandler(req, res);
  } catch (err: any) {
    console.warn('Vercel serverless /api/weather caught exception:', err?.message || err);
    if (!res.headersSent) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      const fallback = {
        available: false,
        message: 'Weather data not available for this location',
      };
      if (typeof res.status === 'function') {
        res.status(200).json(fallback);
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify(fallback));
      }
    }
  }
}
