import type { Request, Response } from 'express';
import { geocodeHandler } from '../server/geocode';

export default async function handler(req: Request, res: Response) {
  return geocodeHandler(req, res);
}
