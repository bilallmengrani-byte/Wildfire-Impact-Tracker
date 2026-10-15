import React, { useEffect, useState } from 'react';
import {
  Flame,
  X,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Bell,
  Compass,
} from 'lucide-react';
import { ProximityAlert } from '../lib/types';
import { formatDistanceMiles } from '../lib/distance';
import { formatDetectionToShortTime } from '../lib/time';

interface AlertToastProps {
  alerts: ProximityAlert[];
  onDismiss: (alertId: string) => void;
  onInspect: (alert: ProximityAlert) => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({
  alerts,
  onDismiss,
  onInspect,
}) => {
  if (alerts.length === 0) return null;

  // Show the latest alert, with a badge if multiple are queued
  const currentAlert = alerts[0];
  const remainingCount = alerts.length - 1;

  return (
    <aside
      aria-label="Proximity Alert Notification"
      className="fixed top-16 right-3 sm:right-6 z-[600] w-[calc(100vw-1.5rem)] max-w-sm transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-zinc-950/95 backdrop-blur-xl border border-red-700/70 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        {/* Subtle accent bar at top */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

        <div className="p-3.5 space-y-2.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                  Proximity Alert
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950 border border-red-800/80 text-red-200 font-mono">
                  &lt; 50 Miles
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {remainingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  +{remainingCount} more
                </span>
              )}
              <button
                onClick={() => onDismiss(currentAlert.id)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                title="Dismiss alert"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Alert Body */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">{currentAlert.placeName}</span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-snug">
              Thermal hotspot detected{' '}
              <strong className="text-amber-300 font-bold">
                {formatDistanceMiles(currentAlert.distanceMiles)}
              </strong>{' '}
              from your saved location.
            </p>

            <div className="pt-1 flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <span className="text-orange-400 font-medium">FRP: {currentAlert.frp} MW</span>
              <span>•</span>
              <span className="text-emerald-400">{currentAlert.confidence} Conf.</span>
              <span>•</span>
              <span>{formatDetectionToShortTime('', currentAlert.acqTime)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => onDismiss(currentAlert.id)}
              className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition cursor-pointer font-medium"
            >
              Dismiss
            </button>

            <button
              onClick={() => onInspect(currentAlert)}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-md shadow-red-950/40"
            >
              <span>Inspect on Map</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
