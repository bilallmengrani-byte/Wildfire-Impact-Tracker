import type { Request, Response } from 'express';
import { getAirQualityHandler } from '../server/airquality';
import { safeSendJson } from '../server/response';

export default async function handler(req: Request | any, res: Response | any) {
  try {
    return await getAirQualityHandler(req, res);
  } catch (err: any) {
    console.warn('Vercel serverless /api/airquality caught exception:', err?.message || err);
    safeSendJson(res, 200, {
      available: false,
      message: 'No nearby air quality station — check AirNow.gov directly',
    });
  }
}
