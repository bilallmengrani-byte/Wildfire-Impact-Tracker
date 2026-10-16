import type { Request, Response } from 'express';
import { getWeatherHandler } from '../server/weather';

export default async function handler(req: Request, res: Response) {
  return getWeatherHandler(req, res);
}
