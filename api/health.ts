import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'Wildfire Impact Tracker API (Vercel Serverless)',
    hasKeyConfigured: Boolean(process.env.FIRMS_MAP_KEY && process.env.FIRMS_MAP_KEY !== 'MY_NASA_FIRMS_MAP_KEY'),
    hasAirNowConfigured: Boolean(process.env.AIRNOW_API_KEY && process.env.AIRNOW_API_KEY !== 'MY_AIRNOW_API_KEY'),
    timestamp: new Date().toISOString(),
  });
}
