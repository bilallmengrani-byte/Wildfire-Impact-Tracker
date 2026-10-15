import React from 'react';
import { Wind, ExternalLink, Activity, Info, Gauge } from 'lucide-react';
import { AirQualityData } from '../lib/types';
import { formatAirNowToLocalTime } from '../lib/time';

interface AirQualityCardProps {
  airQuality: AirQualityData | null;
  isLoading?: boolean;
}

export const AirQualityCard: React.FC<AirQualityCardProps> = ({
  airQuality,
  isLoading = false,
}) => {
  const getAqiTheme = (aqi: number, categoryName?: string) => {
    const cat = (categoryName || '').toLowerCase();
    if (aqi > 300 || cat.includes('hazardous')) {
      return {
        textColor: 'text-rose-400',
        borderColor: 'border-rose-700/70',
        bgColor: 'bg-rose-950/30',
        badgeBg: 'bg-rose-950 text-rose-300 border-rose-700',
        label: 'Hazardous',
      };
    }
    if (aqi > 200 || cat.includes('very unhealthy')) {
      return {
        textColor: 'text-purple-400',
        borderColor: 'border-purple-600/70',
        bgColor: 'bg-purple-950/30',
        badgeBg: 'bg-purple-950 text-purple-300 border-purple-700',
        label: 'Very Unhealthy',
      };
    }
    if (aqi > 150 || cat === 'unhealthy') {
      return {
        textColor: 'text-red-400',
        borderColor: 'border-red-600/70',
        bgColor: 'bg-red-950/30',
        badgeBg: 'bg-red-950 text-red-300 border-red-700',
        label: 'Unhealthy',
      };
    }
    if (aqi > 100 || cat.includes('sensitive')) {
      return {
        textColor: 'text-orange-400',
        borderColor: 'border-orange-600/70',
        bgColor: 'bg-orange-950/30',
        badgeBg: 'bg-orange-950 text-orange-300 border-orange-700',
        label: 'Unhealthy for Sensitive Groups',
      };
    }
    if (aqi > 50 || cat.includes('moderate')) {
      return {
        textColor: 'text-amber-400',
        borderColor: 'border-amber-600/70',
        bgColor: 'bg-amber-950/30',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-700',
        label: 'Moderate',
      };
    }
    return {
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-600/70',
      bgColor: 'bg-emerald-950/30',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      label: 'Good',
    };
  };

  return (
    <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Air Quality Context
          </h3>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
          EPA AirNow
        </span>
      </div>

      {isLoading ? (
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <span className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></span>
          <span>Checking nearest AirNow sensor...</span>
        </div>
      ) : airQuality?.available && airQuality.aqi !== undefined ? (
        (() => {
          const theme = getAqiTheme(airQuality.aqi, airQuality.category);
          return (
            <div
              className={`p-3.5 rounded-xl border space-y-2.5 ${theme.bgColor} ${theme.borderColor}`}
            >
              {/* AQI Value & Category */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${theme.badgeBg}`}
                    >
                      {airQuality.category || theme.label}
                    </span>
                    {airQuality.primaryPollutant && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                        {airQuality.primaryPollutant}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 block">
                    Current Air Quality Index
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold font-mono ${theme.textColor}`}>
                    {airQuality.aqi}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">AQI</span>
                </div>
              </div>

              {/* Station Name & Distance */}
              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-zinc-400">Station:</span>
                  <span className="font-medium text-zinc-200 truncate max-w-[200px]">
                    {airQuality.stationName}
                  </span>
                </div>
                {airQuality.stationDistanceMiles !== undefined && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-zinc-400">Station distance:</span>
                    <span className="font-mono text-zinc-200 font-medium">
                      {airQuality.stationDistanceMiles} miles from place
                    </span>
                  </div>
                )}
                {airQuality.observationTimestamp && (
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Observed at:</span>
                    <span className="text-zinc-300 text-[10px] text-right">
                      {formatAirNowToLocalTime(airQuality.observationTimestamp)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="italic">Ground sensor data (independent of satellite index)</span>
                <a
                  href="https://www.airnow.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  AirNow.gov
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        })()
      ) : (
        /* Requirement 2: If unavailable: "No nearby air quality station — check AirNow.gov directly" */
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span className="text-zinc-300">
              No nearby air quality station — check AirNow.gov directly
            </span>
          </div>
          <a
            href="https://www.airnow.gov/"
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 p-1 rounded hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition"
            title="Open AirNow.gov"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
