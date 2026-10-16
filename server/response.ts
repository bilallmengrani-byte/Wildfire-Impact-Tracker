/**
 * Safe HTTP response utilities compatible with Express, Vercel Serverless Functions,
 * and standard Node.js http.ServerResponse objects.
 */
export function safeSetHeader(res: any, name: string, value: string): void {
  if (!res.headersSent && typeof res.setHeader === 'function') {
    res.setHeader(name, value);
  }
}

export function safeSendJson(res: any, status: number, data: any): void {
  if (res.headersSent) return;
  safeSetHeader(res, 'Content-Type', 'application/json');
  safeSetHeader(res, 'Access-Control-Allow-Origin', '*');
  safeSetHeader(res, 'Access-Control-Allow-Methods', 'GET, OPTIONS');
  safeSetHeader(res, 'Access-Control-Allow-Headers', 'Content-Type');

  if (typeof res.status === 'function') {
    res.status(status);
    if (typeof res.json === 'function') {
      res.json(data);
      return;
    }
  } else {
    res.statusCode = status;
  }
  res.end(JSON.stringify(data));
}
