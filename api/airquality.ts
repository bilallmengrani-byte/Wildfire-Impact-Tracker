import type { Request, Response } from 'express';
import { getAirQualityHandler } from '../server/airquality';

export default async function handler(req: Request, res: Response) {
  return getAirQualityHandler(req, res);
}
