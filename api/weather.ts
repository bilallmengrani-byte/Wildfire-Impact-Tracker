import type { Request, Response } from 'express';
import { getWeatherHandler } from '../server/weather';
import { safeSendJson } from '../server/response';

export default async function handler(req: Request | any, res: Response | any) {
  try {
    return await getWeatherHandler(req, res);
  } catch (err: any) {
    console.warn('Vercel serverless /api/weather caught exception:', err?.message || err);
    safeSendJson(res, 200, {
      available: false,
      message: 'Weather data not available for this location',
    });
  }
}
