import express, { Request, Response } from 'express';
import { getFiresHandler } from './fires';
import { geocodeHandler } from './geocode';
import { getWeatherHandler } from './weather';
import { getAirQualityHandler } from './airquality';

const router = express.Router();

router.use(express.json());

// NASA FIRMS Live Fire Detection Route
router.get(['/api/fires', '/fires'], getFiresHandler);

// OpenStreetMap Nominatim Geocoding Route
router.get(['/api/geocode', '/geocode'], geocodeHandler);

// National Weather Service Wind & Weather Route
router.get(['/api/weather', '/weather'], getWeatherHandler);

// EPA AirNow Air Quality Route
router.get(['/api/airquality', '/airquality'], getAirQualityHandler);

// Health & Status Route
router.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Wildfire Impact Tracker API',
    hasKeyConfigured: Boolean(process.env.FIRMS_MAP_KEY && process.env.FIRMS_MAP_KEY !== 'MY_NASA_FIRMS_MAP_KEY'),
    hasAirNowConfigured: Boolean(process.env.AIRNOW_API_KEY && process.env.AIRNOW_API_KEY !== 'MY_AIRNOW_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

export default router;
