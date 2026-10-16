import type { Request, Response } from 'express';
import { geocodeHandler } from '../server/geocode';

export default async function handler(req: Request | any, res: Response | any) {
  try {
    return await geocodeHandler(req, res);
  } catch (err: any) {
    console.warn('Vercel serverless /api/geocode caught exception:', err?.message || err);
    if (!res.headersSent) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      if (typeof res.status === 'function') {
        res.status(200).json([]);
      } else {
        res.statusCode = 200;
        res.end(JSON.stringify([]));
      }
    }
  }
}
