# Wildfire Impact Tracker

A real-time situational awareness and wildfire intelligence web application for the continental United States. It combines polar-orbiting satellite thermal telemetry, live National Weather Service wind vectors, EPA air quality observations, and geodesic proximity analysis into an educational Prototype Impact Index.

---

## 🌟 What It Does

1. **Live Satellite Fire Monitoring**:
   - Visualizes active thermal hotspots across the Continental US captured by the NASA VIIRS SNPP instrument over the past 24 hours.
   - Categorizes detections by Fire Radiative Power (FRP in Megawatts) and brightness temperature.
   - Interactive popups display acquisition timestamps converted to the user's local timezone, detection confidence, and fire metrics.

2. **Location Search & Haversine Distance Calculation**:
   - Search any US municipality, county, or landmark using OpenStreetMap Nominatim.
   - Automatically drops a blue pin, centers the camera, and computes the geodesic distance (in miles) from the community to every active fire detection.
   - Highlights hotspots within a 150-mile impact zone and dims regional background activity.

3. **Local State-Based Proximity Alerts**:
   - Save frequently monitored places to `localStorage`.
   - Checks saved locations against fire detections and triggers non-intrusive toast notifications if a new detection occurs within a 50-mile radius.
   - 1-click "Inspect on Map" navigates directly to the fire hotspot.

4. **Weather & Wind Vector Context**:
   - Queries the nearest NOAA National Weather Service (NWS) observation station.
   - Displays real-time wind speed, meteorological direction (degrees + cardinal), temperature, and a dynamic wind vector arrow showing which direction the wind is blowing.

5. **Prototype Impact Index (0–100 Score)**:
   - A transparent, documented educational scoring model evaluating 4 input factors:
     - **Proximity (up to 40 pts)**: Distance to nearest fire detection within 150 miles.
     - **Recency (up to 25 pts)**: Elapsed time since the thermal anomaly was observed.
     - **Persistence (up to 15 pts)**: Number of distinct satellite sweeps detecting heat.
     - **Wind Alignment (up to 20 pts)**: Spherical bearing trigonometry calculating if surface winds carry smoke downwind toward the community.
   - Color-coded gauge with an expandable "Why this score?" breakdown.

6. **EPA AirNow Air Quality Context**:
   - Independent ambient Air Quality Index (AQI) from nearby monitoring stations within 50 miles.
   - Explicitly decoupled from the satellite index to distinguish between fire proximity and ground air sensor readings.

---

## 🔑 Setup Instructions & API Keys

To run the application with live external services, configure environment variables in your `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

### Required & Optional API Keys

1. **NASA FIRMS MAP Key** (`FIRMS_MAP_KEY`):
   - **Purpose**: Live 24-hour satellite fire detections (VIIRS SNPP).
   - **How to get it**: Free instant registration at [NASA FIRMS Map Key Request](https://firms.modaps.eosdis.nasa.gov/api/map_key/).
   - **Fallback**: If not provided, the server gracefully serves a curated 24-hour VIIRS Continental US dataset with clear indicators.

2. **EPA AirNow API Key** (`AIRNOW_API_KEY`):
   - **Purpose**: Ambient ground station Air Quality Index (AQI) observations.
   - **How to get it**: Free developer account at [AirNow API Account Request](https://docs.airnowapi.org/account/request/).
   - **Fallback**: If omitted or station is >50 miles away, displays a friendly notice with a direct link to AirNow.gov.

3. **National Weather Service (NWS) API**:
   - **No API key required**. Uses policy-compliant User-Agent identification for NOAA Weather API (`api.weather.gov`).

4. **OpenStreetMap Nominatim Geocoding**:
   - **No API key required**. Uses policy-compliant User-Agent via the backend proxy (`/api/geocode`).

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server (runs full-stack Express + Vite on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## ⚡ Deploying to Vercel

The application is pre-configured for instant zero-config deployment on Vercel:

1. **Static Frontend + Serverless API**:
   - `vercel.json` configures Vite production output (`dist/`) and routes SPA subpaths without 404 errors.
   - Serverless functions in the `api/` directory (`api/fires.ts`, `api/weather.ts`, `api/airquality.ts`, `api/geocode.ts`, `api/health.ts`) handle all backend endpoints serverlessly.
2. **Environment Variables on Vercel**:
   - In your Vercel Project Dashboard (`Settings` -> `Environment Variables`), configure:
     - `FIRMS_MAP_KEY`: Your NASA FIRMS map key.
     - `AIRNOW_API_KEY`: Your EPA AirNow API key.
3. **Automatic Fallback Protection**:
   - If serverless functions or external APIs are unreachable, the client automatically falls back to curated continental US fire data so the map and analytics never break or show raw 404 pages.


---

## 📡 Data Sources & Attributions

- **NASA FIRMS (Fire Information for Resource Management System)**:
  - VIIRS (Visible Infrared Imaging Radiometer Suite) 375m active fire data courtesy of NASA EOSDIS / Land, Atmosphere Near real-time Capability for EOS (LANCE).
  - Attribution: [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)
- **National Weather Service (NOAA NWS)**:
  - Surface meteorological observations and terminal aerodrome forecasts courtesy of the National Oceanic and Atmospheric Administration.
  - Attribution: [weather.gov](https://www.weather.gov/)
- **EPA AirNow**:
  - Ground-level Air Quality Index (AQI) data courtesy of the U.S. Environmental Protection Agency, NOAA, NPS, and state/local air agencies.
  - Attribution: [airnow.gov](https://www.airnow.gov/)
- **OpenStreetMap & CARTO**:
  - Map tiles & geocoding &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, &copy; [CARTO](https://carto.com/attributions).
- **Public Safety Notice**:
  - The Prototype Impact Index is an educational prototype and not an official emergency warning system. During emergencies, always consult [911.gov](https://www.911.gov/) and local emergency authorities.
