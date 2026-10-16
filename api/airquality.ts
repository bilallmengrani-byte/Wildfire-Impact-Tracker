import type { Request, Response } from 'express';
import { getAirQualityHandler } from '../server/airquality';

export default async function handler(req: Request | any, res: Response | any) {
  try {
    return await getAirQualityHandler(req, res);
  } catch (err: any) {
    console.warn('Vercel serverless /api/airquality caught exception:', err?.message || err);
    if (!res.headersSent) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      const fallback = {
        available: false,
        message: 'No nearby air quality station — check AirNow.gov directly',
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
