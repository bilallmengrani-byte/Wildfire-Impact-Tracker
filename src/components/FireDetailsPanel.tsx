import React from 'react';
import {
  Flame,
  X,
  Compass,
  Satellite,
  Thermometer,
  Zap,
  Shield,
  MapPin,
  Clock,
  Radio,
  Wind,
  Navigation,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FireDetection, SelectedPlace, WeatherData, AirQualityData } from '../lib/types';
import { formatDistanceMiles, formatCoordinatesLabel } from '../lib/distance';
import { calculateImpactIndex } from '../lib/scoring';
import { formatDetectionToLocalTime, formatDetectionToShortTime, formatIsoToLocalTime } from '../lib/time';
import { ImpactIndexCard } from './ImpactIndexCard';
import { AirQualityCard } from './AirQualityCard';

interface FireDetailsPanelProps {
  selectedDetection: FireDetection | null;
  onCloseDetection: () => void;
  selectedPlace: SelectedPlace | null;
  onClosePlace: () => void;
  detections: FireDetection[];
  onSelectDetection: (detection: FireDetection | null) => void;
  isRealDataLoaded?: boolean;
  weather: WeatherData | null;
  isWeatherLoading?: boolean;
  airQuality?: AirQualityData | null;
  isAirQualityLoading?: boolean;
}

export const FireDetailsPanel: React.FC<FireDetailsPanelProps> = ({
  selectedDetection,
  onCloseDetection,
  selectedPlace,
  onClosePlace,
  detections,
  onSelectDetection,
  isRealDataLoaded = false,
  weather,
  isWeatherLoading = false,
  airQuality = null,
  isAirQualityLoading = false,
}) => {
  // Compute distance metrics for selected place
  const inRangeDetections = React.useMemo(() => {
    if (!selectedPlace) return [];
    return detections
      .filter((d) => d.isWithinRange)
      .sort((a, b) => (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999));
  }, [selectedPlace, detections]);

  const nearestDetection = inRangeDetections.length > 0 ? inRangeDetections[0] : null;

  const mostRecentDetection = React.useMemo(() => {
    if (inRangeDetections.length === 0) return null;
    return inRangeDetections[0];
  }, [inRangeDetections]);

  // Requirement 1: Calculate the Prototype Impact Index
  const impactIndex = React.useMemo(() => {
    return calculateImpactIndex(detections, weather, selectedPlace);
  }, [detections, weather, selectedPlace]);

  const hasActiveSelection = Boolean(selectedPlace || selectedDetection);
  const [isMobileMinimized, setIsMobileMinimized] = React.useState(false);

  // Auto-expand on new selection
  React.useEffect(() => {
    setIsMobileMinimized(false);
  }, [selectedPlace?.id, selectedDetection?.id]);

  // Helper to format ISO timestamp into readable local time
  const formatObsTime = (isoString?: string) => {
    return formatIsoToLocalTime(isoString);
  };

  // On mobile screens, hide the large placeholder card when nothing is selected
  // so the map has 100% full viewport visibility
  if (!hasActiveSelection) {
    return (
      <section
        aria-label="Fire Details Placeholder"
        className="
          hidden md:flex fixed md:absolute bottom-6 right-6 z-[450]
          w-96 max-h-[calc(100vh-6rem)]
          bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90
          rounded-2xl shadow-2xl flex-col text-zinc-100 overflow-hidden
          transition-all duration-300
        "
      >
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-zinc-900 border-zinc-800 text-zinc-400">
              <Radio className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Fire Details</h2>
              <p className="text-[10px] text-zinc-400">Proximity & Telemetry</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center mb-3.5 shadow-inner">
            <Compass className="w-7 h-7 text-zinc-500 animate-[spin_12s_linear_infinite]" />
          </div>
          <p className="text-sm font-medium text-zinc-200 mb-1.5">No active selection</p>
          <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed">
            Select a location pin or tap any thermal hotspot on the map to inspect live fire telemetry.
          </p>
        </div>
      </section>
    );
  }

  // Mobile Minimized Bar: Sleek, high-visibility 1-row bottom pill
  if (isMobileMinimized) {
    const minLabel = selectedDetection
      ? (selectedDetection.name || formatCoordinatesLabel(selectedDetection.latitude, selectedDetection.longitude))
      : selectedPlace?.name;

    return (
      <aside
        onClick={() => setIsMobileMinimized(false)}
        className="
          fixed bottom-3 left-3 right-3 z-[450] md:hidden
          bg-zinc-950/95 backdrop-blur-xl border border-zinc-700/80
          rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-2.5
          cursor-pointer animate-in fade-in slide-in-from-bottom-2 select-none
        "
        aria-label="Tap to expand fire telemetry"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              selectedDetection
                ? 'bg-orange-950/70 border-orange-700 text-orange-400'
                : 'bg-blue-950/70 border-blue-700 text-blue-400'
            }`}
          >
            {selectedDetection ? <Flame className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span className="truncate">{minLabel}</span>
              {selectedPlace && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 flex-shrink-0">
                  {impactIndex.score}/100
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 truncate">
              {selectedDetection
                ? `FRP: ${selectedDetection.frp} MW • Tap to inspect telemetry`
                : `${inRangeDetections.length} fires within 150 mi • Tap for details`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMinimized(false);
            }}
            className="p-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-800/80 active:bg-zinc-700 cursor-pointer"
            title="Expand"
            aria-label="Expand details"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (selectedDetection) onCloseDetection();
              else onClosePlace();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/80 active:bg-zinc-700 cursor-pointer"
            title="Close"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <section
      aria-label="Fire Details"
      className="
        fixed md:absolute bottom-0 md:bottom-6 right-0 md:right-6 z-[450]
        w-full md:w-96 max-h-[60vh] sm:max-h-[75vh] md:max-h-[calc(100vh-6rem)]
        bg-zinc-950/95 backdrop-blur-xl border-t md:border border-zinc-800/90
        rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden
        transition-all duration-300
      "
    >
      {/* Mobile Top Drag Indicator */}
      <div
        onClick={() => setIsMobileMinimized(true)}
        className="w-full py-1.5 flex justify-center md:hidden cursor-pointer bg-zinc-900/60 border-b border-zinc-800/40"
        title="Swipe or tap down to minimize"
      >
        <div className="w-12 h-1 bg-zinc-600 rounded-full"></div>
      </div>

      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
              selectedDetection
                ? 'bg-orange-950/60 border-orange-700/50 text-orange-400'
                : selectedPlace
                ? 'bg-blue-950/60 border-blue-700/50 text-blue-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {selectedDetection ? (
              <Flame className="w-4 h-4 text-orange-400" />
            ) : selectedPlace ? (
              <MapPin className="w-4 h-4 text-blue-400" />
            ) : (
              <Radio className="w-4 h-4 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-white truncate">
              {selectedDetection
                ? (selectedDetection.name || formatCoordinatesLabel(selectedDetection.latitude, selectedDetection.longitude))
                : selectedPlace?.name || 'Fire Details'}
            </h2>
            <p className="text-[10px] text-zinc-400 truncate">
              {selectedDetection
                ? 'Satellite Thermal Telemetry'
                : selectedPlace
                ? '150-Mile Impact Index & Context'
                : 'Proximity & Telemetry'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mobile Minimize Toggle Button */}
          <button
            onClick={() => setIsMobileMinimized(true)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Minimize panel"
            aria-label="Minimize panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={selectedDetection ? onCloseDetection : onClosePlace}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(60vh-4rem)] sm:max-h-[calc(75vh-4rem)] md:max-h-[calc(100vh-12rem)] space-y-4">
        {!hasActiveSelection ? (
          /* Default state when nothing is selected */
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center mb-3.5 shadow-inner">
              <Compass className="w-7 h-7 text-zinc-500 animate-[spin_12s_linear_infinite]" />
            </div>
            <p className="text-sm font-medium text-zinc-200 mb-1.5">
              Select a location to see nearby fire activity.
            </p>
            <p className="text-xs text-zinc-500 max-w-[260px] leading-relaxed">
              Use the search bar on the left to select any US place to view nearby fire activity, the Prototype Impact Index, and live NWS wind telemetry.
            </p>

            <div className="mt-5 w-full pt-4 border-t border-zinc-900 grid grid-cols-2 gap-2 text-left text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <span className="text-[10px] text-zinc-400 block font-medium">Impact Index</span>
                <span className="text-blue-400 font-semibold text-xs">0–100 Transparent Score</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <span className="text-[10px] text-zinc-400 block font-medium">Weather Feed</span>
                <span className="text-sky-400 font-semibold text-xs">NOAA NWS Live</span>
              </div>
            </div>
          </div>
        ) : selectedDetection ? (
          /* Individual Fire Detection Selected */
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-700/60">
                  <Flame className="w-3 h-3 text-red-400" />
                  Thermal Hotspot
                </span>
                <span className="text-[11px] text-zinc-400 font-medium ml-auto">
                  {formatDetectionToShortTime(selectedDetection.acq_date, selectedDetection.acq_time)}
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-tight">
                {selectedDetection.name || formatCoordinatesLabel(selectedDetection.latitude, selectedDetection.longitude)}
              </h3>

              {/* Distance from selected place if one is set */}
              {selectedPlace && selectedDetection.distanceMiles !== undefined && (
                <div className="mt-2 p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-blue-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>From {selectedPlace.name}:</span>
                  </div>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatDistanceMiles(selectedDetection.distanceMiles)}
                  </span>
                </div>
              )}
            </div>

            {/* Coordinates Banner */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Coordinates:</span>
              </div>
              <span className="font-mono text-zinc-200 text-xs">
                {selectedDetection.latitude.toFixed(4)}° N, {Math.abs(selectedDetection.longitude).toFixed(4)}° W
              </span>
            </div>

            {/* Key Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fire Radiative Power</span>
                </div>
                <div className="text-lg font-bold text-amber-400 font-mono">
                  {selectedDetection.frp}{' '}
                  <span className="text-xs font-normal text-zinc-400">MW</span>
                </div>
                <span className="text-[10px] text-zinc-400">Thermal energy output</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-red-400" />
                  <span>Brightness</span>
                </div>
                <div className="text-lg font-bold text-red-400 font-mono">
                  {selectedDetection.brightness}{' '}
                  <span className="text-xs font-normal text-zinc-400">K</span>
                </div>
                <span className="text-[10px] text-zinc-400">Sensor channel heat</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confidence Level</span>
                </div>
                <div className="text-base font-bold text-emerald-400">
                  {selectedDetection.confidence}
                </div>
                <span className="text-[10px] text-zinc-400">Detection quality</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                  <Satellite className="w-3.5 h-3.5 text-blue-400" />
                  <span>Instrument</span>
                </div>
                <div className="text-sm font-semibold text-zinc-200 truncate">
                  VIIRS SNPP
                </div>
                <span className="text-[10px] text-zinc-400">NASA EOSDIS</span>
              </div>
            </div>

            {/* Acquisition Date and Time */}
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-zinc-400 flex-shrink-0">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Detection Time:</span>
              </div>
              <span className="text-zinc-200 font-medium text-right">
                {formatDetectionToLocalTime(selectedDetection.acq_date, selectedDetection.acq_time)}
              </span>
            </div>

            <button
              onClick={onCloseDetection}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/80 transition cursor-pointer"
            >
              {selectedPlace ? 'Back to Location Summary' : 'Clear Selection'}
            </button>
          </div>
        ) : selectedPlace ? (
          /* Selected Place Summary + Impact Index + Weather Context */
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/60">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  Selected Location
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  150 Mi Buffer
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-tight">
                {selectedPlace.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                {selectedPlace.displayName}
              </p>
            </div>

            {/* Requirement 2: Prototype Impact Index Card */}
            <ImpactIndexCard impact={impactIndex} />

            {/* Fire Proximity Metrics Cards */}
            <div className="space-y-2.5">
              {/* Total detections within 150 miles */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Total Detections within 150 Miles
                  </span>
                  <div className="text-2xl font-bold text-white font-mono mt-0.5 flex items-baseline gap-1.5">
                    <span className={inRangeDetections.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {inRangeDetections.length}
                    </span>
                    <span className="text-xs font-normal text-zinc-400">
                      hotspots detected
                    </span>
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    inRangeDetections.length > 0
                      ? 'bg-red-950/50 border-red-700/50 text-red-400'
                      : 'bg-emerald-950/50 border-emerald-700/50 text-emerald-400'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </div>
              </div>

              {/* Nearest detection distance */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Nearest Fire Detection
                  </span>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {nearestDetection
                      ? `Nearest fire: ${formatDistanceMiles(nearestDetection.distanceMiles!)}`
                      : 'No fires within 150 miles'}
                  </div>
                  {nearestDetection && (
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      FRP: {nearestDetection.frp} MW • {nearestDetection.confidence} Confidence
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-700/50 text-amber-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
              </div>

              {/* Most recent detection time */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Most Recent Detection
                  </span>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">
                    {mostRecentDetection
                      ? formatDetectionToLocalTime(mostRecentDetection.acq_date, mostRecentDetection.acq_time)
                      : 'None in past 24 hours'}
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    VIIRS SNPP 24h satellite sweep
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-700/50 text-blue-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Weather Context Section */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Weather Context
                  </h3>
                </div>
                <span className="text-[10px] text-sky-400/90 font-medium">
                  NOAA NWS
                </span>
              </div>

              {isWeatherLoading ? (
                /* Loading State */
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <span className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></span>
                  <span>Fetching National Weather Service observation...</span>
                </div>
              ) : weather?.available ? (
                /* Weather observation successfully retrieved */
                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/50 space-y-3">
                  {/* Wind speed, direction and pointing arrow */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400 block font-medium">
                        Surface Wind Conditions
                      </span>
                      {weather.windSpeedMph !== undefined && weather.windDirectionCardinal ? (
                        <div className="text-sm font-bold text-sky-200 font-mono">
                          Wind: {weather.windSpeedMph} mph from {weather.windDirectionCardinal} ({weather.windDirectionDeg ?? 0}°)
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-zinc-300">
                          Wind: Calm / Light
                        </div>
                      )}
                      {weather.temperatureF !== undefined && (
                        <div className="text-xs text-zinc-300 flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                          <span>Temperature: <strong>{weather.temperatureF}°F</strong> ({weather.temperatureC}°C)</span>
                        </div>
                      )}
                    </div>

                    {/* Wind direction arrow icon pointing the direction wind is blowing */}
                    {weather.windDirectionDeg !== undefined && (
                      <div className="flex flex-col items-center justify-center">
                        <div
                          className="w-11 h-11 rounded-full bg-sky-900/60 border border-sky-500/60 flex items-center justify-center shadow-lg shadow-sky-950/40 transition-transform duration-500"
                          title={`Wind blowing towards ${((weather.windDirectionDeg + 180) % 360)}°`}
                        >
                          <Navigation
                            className="w-6 h-6 text-sky-300 fill-sky-400/40"
                            style={{
                              transform: `rotate(${(weather.windDirectionDeg + 180) % 360}deg)`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-sky-400/90 font-mono mt-1">
                          Blowing {((weather.windDirectionDeg + 180) % 360)}°
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Station Name & Observation Time */}
                  <div className="pt-2 border-t border-sky-900/50 text-[11px] text-zinc-300 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-400">Station:</span>
                      <span className="font-medium text-zinc-200 truncate max-w-[200px]">
                        {weather.stationName}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-400">Observed at:</span>
                      <span className="font-mono text-zinc-200">
                        {formatObsTime(weather.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Note: Source: National Weather Service — observed at [timestamp] */}
                  <p className="text-[10px] text-zinc-400 italic pt-1 border-t border-sky-950/80">
                    Source: National Weather Service — observed at {formatObsTime(weather.timestamp)}
                  </p>
                </div>
              ) : (
                /* Weather data unavailable */
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2.5">
                  <Wind className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span>Weather data not available for this location</span>
                </div>
              )}
            </div>

            {/* Requirement 2: Air Quality Context Section */}
            <AirQualityCard airQuality={airQuality} isLoading={isAirQualityLoading} />

            {/* List of nearby detections in range if any */}
            {inRangeDetections.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Nearby Hotspots ({inRangeDetections.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {inRangeDetections.slice(0, 5).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onSelectDetection(d)}
                      className="w-full p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                        <span className="font-semibold text-zinc-200">
                          {formatDistanceMiles(d.distanceMiles!)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                        <span>{d.frp} MW</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClosePlace}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/80 transition cursor-pointer"
            >
              Clear Selected Place
            </button>
          </div>
        ) : null}

        {/* Requirement 3: Official Emergency & Environmental Links Section */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
            <LifeBuoy className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
              Official Emergency & Weather Sources
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <a
              href="https://www.weather.gov/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white transition flex items-center justify-between gap-1 group"
              title="National Weather Service"
            >
              <span className="truncate font-medium">NWS (weather.gov)</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-sky-400 flex-shrink-0" />
            </a>

            <a
              href="https://www.airnow.gov/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white transition flex items-center justify-between gap-1 group"
              title="EPA AirNow Air Quality Index"
            >
              <span className="truncate font-medium">AirNow (airnow.gov)</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400 flex-shrink-0" />
            </a>

            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white transition flex items-center justify-between gap-1 group"
              title="NASA Fire Information for Resource Management System"
            >
              <span className="truncate font-medium">NASA FIRMS</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-orange-400 flex-shrink-0" />
            </a>

            <a
              href="https://www.911.gov/"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white transition flex items-center justify-between gap-1 group"
              title="Local Emergency Services (911.gov)"
            >
              <span className="truncate font-medium">Local 911 (911.gov)</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-red-400 flex-shrink-0" />
            </a>
          </div>

          <p className="text-[10px] text-zinc-500 leading-tight">
            In active fire situations or evacuation alerts, always follow instructions from local public safety authorities.
          </p>
        </div>
      </div>
    </section>
  );
};
