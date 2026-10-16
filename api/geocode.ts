import type { Request, Response } from 'express';
import { geocodeHandler } from '../server/geocode';
import { safeSendJson } from '../server/response';

export default async function handler(req: Request | any, res: Response | any) {
  try {
    return await geocodeHandler(req, res);
  } catch (err: any) {
    console.warn('Vercel serverless /api/geocode caught exception:', err?.message || err);
    safeSendJson(res, 200, []);
  }
}
