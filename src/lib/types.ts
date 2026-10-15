export interface FireDetection {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: string;
  frp: number;
  acq_date: string;
  acq_time: string;
  name?: string;
  locationName?: string;
  state?: string;
  distanceMiles?: number;
  isWithinRange?: boolean;
}

export interface SelectedPlace {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  state?: string;
}

export interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  savedAt: string;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  displayName?: string;
  state: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface WeatherData {
  available: boolean;
  message?: string;
  windSpeedMph?: number;
  windDirectionDeg?: number;
  windDirectionCardinal?: string;
  temperatureF?: number;
  temperatureC?: number;
  timestamp?: string;
  stationName?: string;
  stationId?: string;
}

export interface AirQualityData {
  available: boolean;
  message?: string;
  aqi?: number;
  category?: string;
  categoryNumber?: number;
  primaryPollutant?: string;
  stationName?: string;
  stationDistanceMiles?: number;
  observationTimestamp?: string;
}

export interface ProximityAlert {
  id: string;
  placeId: string;
  placeName: string;
  fireId: string;
  distanceMiles: number;
  frp: number;
  confidence: string;
  acqTime: string;
  fireLat: number;
  fireLng: number;
  placeLat: number;
  placeLng: number;
  timestamp: number;
}
