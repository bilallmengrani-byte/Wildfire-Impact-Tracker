export default function handler(_req: any, res: any) {
  if (res.headersSent) return;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  const payload = {
    status: 'ok',
    service: 'Wildfire Impact Tracker API (Vercel Serverless)',
    hasKeyConfigured: Boolean(process.env.FIRMS_MAP_KEY && process.env.FIRMS_MAP_KEY !== 'MY_NASA_FIRMS_MAP_KEY'),
    hasAirNowConfigured: Boolean(process.env.AIRNOW_API_KEY && process.env.AIRNOW_API_KEY !== 'MY_AIRNOW_API_KEY'),
    timestamp: new Date().toISOString(),
  };
  if (typeof res.status === 'function') {
    res.status(200);
    if (typeof res.json === 'function') {
      res.json(payload);
      return;
    }
  } else {
    res.statusCode = 200;
  }
  res.end(JSON.stringify(payload));
}
