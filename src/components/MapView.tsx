import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Compass, ExternalLink, MapPin, Sun, Moon } from 'lucide-react';
import { FireDetection, SelectedPlace } from '../lib/types';
import { formatDistanceMiles, formatCoordinatesLabel } from '../lib/distance';
import { formatDetectionToLocalTime } from '../lib/time';
import { MapLegend } from './MapLegend';

// Blue pin icon for the selected location
const createBluePinIcon = () => {
  return L.divIcon({
    className: 'custom-blue-pin',
    html: `
      <div style="position: relative; width: 36px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-18px, -42px);">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          bottom: -4px;
          border-radius: 9999px;
          background: rgba(59, 130, 246, 0.35);
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
        <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37 18.63 0 12 0Z" fill="#2563eb" stroke="#ffffff" stroke-width="1.8"/>
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -38],
  });
};

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);

  return null;
};

interface MapViewProps {
  detections: FireDetection[];
  selectedDetection: FireDetection | null;
  onSelectDetection: (detection: FireDetection | null) => void;
  flyToLocation: { lat: number; lng: number; zoom: number } | null;
  onResetView: () => void;
  isRealDataLoaded: boolean;
  selectedPlace: SelectedPlace | null;
  filterWithinRangeOnly?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  detections,
  selectedDetection,
  onSelectDetection,
  flyToLocation,
  onResetView,
  isRealDataLoaded,
  selectedPlace,
  filterWithinRangeOnly = false,
}) => {
  const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
  const DEFAULT_ZOOM = 4.5;

  const currentCenter: [number, number] = flyToLocation
    ? [flyToLocation.lat, flyToLocation.lng]
    : selectedPlace
    ? [selectedPlace.lat, selectedPlace.lng]
    : selectedDetection
    ? [selectedDetection.latitude, selectedDetection.longitude]
    : DEFAULT_CENTER;

  const currentZoom = flyToLocation?.zoom || (selectedPlace ? 8 : selectedDetection ? 7.5 : DEFAULT_ZOOM);

  const bluePinIcon = useMemo(() => createBluePinIcon(), []);
  const [mapTheme, setMapTheme] = useState<'dark' | 'standard'>('dark');

  // Filter or highlight detections based on selectedPlace & range (150 miles)
  const visibleDetections = useMemo(() => {
    if (!selectedPlace || !filterWithinRangeOnly) {
      return detections;
    }
    return detections.filter((d) => d.isWithinRange);
  }, [detections, selectedPlace, filterWithinRangeOnly]);

  return (
    <div className="relative w-full h-full bg-slate-950">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={3}
        maxZoom={15}
        zoomControl={false}
        className="w-full h-full z-0"
        attributionControl={true}
      >
        <MapController center={currentCenter} zoom={currentZoom} />
        <ZoomControl position="bottomleft" />

        {/* Free OpenStreetMap Basemap (100% Free, No Watermark, OSM Attribution) */}
        <TileLayer
          key={mapTheme}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          className={mapTheme === 'dark' ? 'dark-osm-tiles' : ''}
          maxZoom={19}
        />

        {/* 150-Mile Radius Zone Circle around selected place */}
        {selectedPlace && (
          <Circle
            center={[selectedPlace.lat, selectedPlace.lng]}
            radius={150 * 1609.344} // 150 miles in meters
            pathOptions={{
              color: '#3b82f6',
              weight: 1.5,
              dashArray: '5, 8',
              fillColor: '#1d4ed8',
              fillOpacity: 0.08,
            }}
          />
        )}

        {/* Blue Pin for Selected Place */}
        {selectedPlace && (
          <Marker
            position={[selectedPlace.lat, selectedPlace.lng]}
            icon={bluePinIcon}
          >
            <Popup className="dark-popup">
              <div className="p-3 text-zinc-100 min-w-[200px] font-sans">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Selected Location</span>
                </div>
                <h4 className="font-bold text-sm text-white mb-0.5">
                  {selectedPlace.name}
                </h4>
                <p className="text-[11px] text-zinc-400 mb-2 truncate max-w-[220px]">
                  {selectedPlace.displayName}
                </p>
                <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 flex justify-between font-mono">
                  <span>150-Mile Radius Active</span>
                  <span>{selectedPlace.lat.toFixed(3)}°, {selectedPlace.lng.toFixed(3)}°</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fire Detection Markers with In-Range Highlighting */}
        {visibleDetections.map((detection) => {
          const isSelected = selectedDetection?.id === detection.id;
          const hasSelectedPlace = Boolean(selectedPlace);
          const inRange = Boolean(detection.isWithinRange);

          // Requirement 5: Highlight detections within range with a brighter color vs the rest
          let markerColor: string;
          let markerRadius: number;
          let fillOpacity: number;
          let strokeWidth: number;

          if (hasSelectedPlace) {
            if (inRange) {
              // In-range (<150 miles): Bright neon red/orange, larger, pulsing presence
              markerColor = detection.frp >= 50 ? '#ff3333' : '#ff7a00';
              markerRadius = isSelected ? 9 : 6.5;
              fillOpacity = 0.95;
              strokeWidth = isSelected ? 3 : 2;
            } else {
              // Outside range: Dimmed, subdued muted color
              markerColor = '#52525b'; // Zinc-600 muted
              markerRadius = isSelected ? 7 : 4;
              fillOpacity = 0.35;
              strokeWidth = 1;
            }
          } else {
            // Default styling when no place selected
            markerColor = detection.frp >= 50 ? '#ef4444' : '#f97316';
            markerRadius = isSelected ? 8 : 5;
            fillOpacity = isSelected ? 0.95 : 0.8;
            strokeWidth = isSelected ? 2.5 : 1.5;
          }

          const pulseClass = isSelected
            ? 'fire-pulse-selected'
            : inRange
            ? 'fire-pulse-high'
            : detection.frp >= 50
            ? 'fire-pulse-high'
            : 'fire-pulse-live';

          const detectionLabel = detection.name || formatCoordinatesLabel(detection.latitude, detection.longitude);

          return (
            <CircleMarker
              key={detection.id}
              center={[detection.latitude, detection.longitude]}
              radius={markerRadius}
              pathOptions={{
                color: isSelected ? '#ffffff' : inRange ? '#ffe4e6' : markerColor,
                fillColor: markerColor,
                fillOpacity: fillOpacity,
                weight: strokeWidth,
                className: pulseClass,
              }}
              eventHandlers={{
                click: () => {
                  onSelectDetection(detection);
                },
              }}
            >
              <Popup className="dark-popup">
                <div className="p-3.5 min-w-[210px] text-zinc-100 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-zinc-800">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 uppercase tracking-wide">
                      <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                      {detectionLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      VIIRS SNPP
                    </span>
                  </div>

                  {/* Required popup fields: Detection Time, Confidence Level, and FRP */}
                  <div className="space-y-1.5 text-xs">
                    {/* Distance from selected place if available */}
                    {detection.distanceMiles !== undefined && selectedPlace && (
                      <div className="p-1.5 mb-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">Distance:</span>
                        <span className={`font-semibold text-xs ${inRange ? 'text-amber-400' : 'text-zinc-400'}`}>
                          {formatDistanceMiles(detection.distanceMiles)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-zinc-400 text-[11px] flex-shrink-0">Detection Time:</span>
                      <span className="font-semibold text-zinc-200 text-[11px] text-right">
                        {formatDetectionToLocalTime(detection.acq_date, detection.acq_time)}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-400 text-[11px]">Confidence Level:</span>
                      <span className="font-semibold text-emerald-400 text-[11px]">
                        {detection.confidence}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-400 text-[11px]">Fire Radiative Power:</span>
                      <span className="font-bold text-orange-400 font-mono text-xs">
                        {detection.frp} MW
                      </span>
                    </div>

                    {detection.brightness > 0 && (
                      <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800/80">
                        <span className="text-zinc-400 text-[10px]">Brightness:</span>
                        <span className="text-zinc-300 font-mono text-[10px]">
                          {detection.brightness} K
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-400 text-[10px]">Coordinates:</span>
                      <span className="text-zinc-300 font-mono text-[10px]">
                        {detection.latitude.toFixed(3)}°, {detection.longitude.toFixed(3)}°
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectDetection(detection)}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Inspect Telemetry
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Map Utility: Continental US View Reset & Basemap Theme Switcher */}
      <div className="absolute top-16 md:top-4 right-3 md:right-4 z-[400] flex flex-col gap-2">
        <button
          onClick={onResetView}
          title="Reset View to Continental US"
          className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 shadow-lg backdrop-blur-md transition flex items-center gap-2 text-xs font-medium cursor-pointer"
        >
          <Compass className="w-4 h-4 text-orange-400" />
          <span className="hidden sm:inline">Continental US</span>
        </button>

        <button
          onClick={() => setMapTheme((prev) => (prev === 'dark' ? 'standard' : 'dark'))}
          title={mapTheme === 'dark' ? 'Switch to Standard OpenStreetMap' : 'Switch to Dark Basemap'}
          className="p-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 shadow-lg backdrop-blur-md transition flex items-center gap-2 text-xs font-medium cursor-pointer"
        >
          {mapTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-400" />
          )}
          <span className="hidden sm:inline">
            {mapTheme === 'dark' ? 'Street Map' : 'Dark Map'}
          </span>
        </button>
      </div>

      {/* Prominent Visible NASA FIRMS Attribution */}
      <div
        className={`absolute z-[400] bg-zinc-950/85 hover:bg-zinc-900/95 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs shadow-lg backdrop-blur-md flex items-center gap-2 transition ${
          selectedPlace ? 'bottom-20 sm:bottom-8' : 'bottom-7 sm:bottom-8'
        } right-3 sm:right-6`}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-zinc-200 font-medium text-[11px]">
            Fire data: <strong className="text-orange-400 font-semibold">NASA FIRMS</strong>
          </span>
        </div>
        <a
          href="https://firms.modaps.eosdis.nasa.gov/"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-400 hover:text-zinc-200 transition"
          title="NASA FIRMS (Fire Information for Resource Management System)"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Floating Map Legend Overlay */}
      <MapLegend
        totalDetectionsCount={detections.length}
        inRangeCount={detections.filter((d) => d.isWithinRange).length}
        selectedPlace={selectedPlace}
        isRealDataLoaded={isRealDataLoaded}
      />
    </div>
  );
};
