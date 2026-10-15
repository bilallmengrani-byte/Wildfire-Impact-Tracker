import React, { useState } from 'react';
import {
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  CircleDot,
  Radio,
  Info,
  Zap,
  Clock,
  Compass,
} from 'lucide-react';
import { SelectedPlace } from '../lib/types';

interface MapLegendProps {
  totalDetectionsCount: number;
  inRangeCount?: number;
  selectedPlace: SelectedPlace | null;
  isRealDataLoaded: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  totalDetectionsCount,
  inRangeCount,
  selectedPlace,
  isRealDataLoaded,
}) => {
  // Collapse by default on mobile screens to preserve map visibility
  const [isExpanded, setIsExpanded] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );

  return (
    <div
      aria-label="Map Marker Legend"
      className={`absolute z-[400] max-w-[280px] sm:max-w-xs transition-all duration-300 ${
        selectedPlace ? 'bottom-20 sm:bottom-5' : 'bottom-5'
      } left-3 sm:left-14`}
    >
      <div className="bg-zinc-950/92 backdrop-blur-md border border-zinc-800/90 rounded-xl shadow-2xl text-zinc-100 overflow-hidden">
        {/* Legend Header & Quick Toggle */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full px-3 py-2.5 bg-zinc-900/60 hover:bg-zinc-900 border-b border-zinc-800/60 flex items-center justify-between gap-2 text-left transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-orange-950/70 border border-orange-700/60 flex items-center justify-center flex-shrink-0">
              <Layers className="w-3 h-3 text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-200 tracking-tight flex items-center gap-1.5">
                <span>Map Legend</span>
                <span className="text-[10px] text-zinc-500 font-mono font-normal">
                  ({totalDetectionsCount} {isRealDataLoaded ? 'Detections' : 'Hotspots'})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-zinc-400">
            <span className="text-[10px] hidden sm:inline">
              {isExpanded ? 'Hide' : 'Show'}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {/* Compact Bar when Collapsed */}
        {!isExpanded && (
          <div className="px-3 py-2 flex items-center gap-3 text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-400/40"></span>
              <span className="text-[10px] text-zinc-400">High FRP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
              <span className="text-[10px] text-zinc-400">Nominal FRP</span>
            </div>
            {selectedPlace && (
              <div className="flex items-center gap-1.5 text-blue-400 text-[10px]">
                <MapPin className="w-3 h-3" />
                <span>Place</span>
              </div>
            )}
          </div>
        )}

        {/* Detailed Legend Sections when Expanded */}
        {isExpanded && (
          <div className="p-3 space-y-3 text-xs animate-in fade-in duration-200 max-h-[60vh] overflow-y-auto">
            {/* 1. Thermal Intensity Scale (FRP) */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Thermal Intensity (FRP)
              </span>

              <div className="space-y-1 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 border border-red-300 ring-2 ring-red-500/40 animate-pulse flex-shrink-0"></span>
                    <span className="font-medium text-zinc-200">High Thermal Output</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-red-400">&ge; 50 MW</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500 border border-orange-300 flex-shrink-0"></span>
                    <span className="font-medium text-zinc-200">Nominal / Developing</span>
                  </div>
                  <span className="text-[10px] font-mono text-orange-400">&lt; 50 MW</span>
                </div>
              </div>
            </div>

            {/* 2. Proximity & Range States (Active when Place Selected) */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block flex items-center gap-1">
                <Compass className="w-3 h-3 text-blue-400" />
                Distance States (150-Mi Buffer)
              </span>

              <div className="space-y-1.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                <div className="flex items-start gap-2 text-[11px]">
                  <div className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="h-3 w-3 rounded-full bg-red-500 border-2 border-white ring-2 ring-red-400/60"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-100 flex items-center gap-1">
                      <span>In-Range Hotspot</span>
                      {selectedPlace && inRangeCount !== undefined && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          ({inRangeCount} near place)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Vibrant marker within 150 miles of chosen location
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] pt-1 border-t border-zinc-800/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-600 opacity-40 mt-0.5 flex-shrink-0"></span>
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-300">Out-of-Range Detection</div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Muted translucent marker beyond the 150-mile impact zone
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Location & Area Geometries */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                Location & Impact Zone
              </span>

              <div className="space-y-1.5 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 flex items-center justify-center flex-shrink-0 text-white">
                    <MapPin className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-100">Selected Location Pin</span>
                    <span className="text-[10px] text-zinc-400 block">
                      Target community, city, or coordinate point
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-zinc-800/50">
                  <span className="w-3.5 h-3.5 rounded border border-blue-400 border-dashed bg-blue-900/20 flex-shrink-0"></span>
                  <div>
                    <span className="font-semibold text-zinc-100">150-Mile Geodesic Radius</span>
                    <span className="text-[10px] text-zinc-400 block">
                      Haversine impact buffer perimeter
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Context Tip */}
            <div className="p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/40 text-[10px] text-zinc-400 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>FRP (Fire Radiative Power):</strong> Instantaneous heat release rate measured in Megawatts (MW) by VIIRS SNPP polar satellites.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
