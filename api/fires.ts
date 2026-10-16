import type { Request, Response } from 'express';
import { getFiresHandler } from '../server/fires';

export default async function handler(req: Request, res: Response) {
  return getFiresHandler(req, res);
}
