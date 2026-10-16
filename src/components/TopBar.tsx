import React from 'react';
import { Menu, AlertTriangle, Flame, RefreshCw, XCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  activeDetectionsCount: number;
  isLoading: boolean;
  errorMessage: string | null;
  isRealDataLoaded: boolean;
  onRetry: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  activeDetectionsCount,
  isLoading,
  errorMessage,
  isRealDataLoaded,
  onRetry,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-[450] pointer-events-none p-3 sm:p-4 flex flex-col gap-2 items-center">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Mobile Header: High visibility, touch-friendly Search & Places trigger */}
        <div className="pointer-events-auto flex md:hidden items-center justify-between w-full gap-2">
          <button
            onClick={onToggleSidebar}
            className="px-3.5 py-2 rounded-xl bg-zinc-950/95 text-zinc-100 border border-zinc-800 shadow-xl backdrop-blur-md hover:bg-zinc-900 active:scale-95 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
            aria-label="Open Search & Saved Places Sidebar"
          >
            <Menu className="w-4 h-4 text-orange-400" />
            <span>Search & Places</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-xl backdrop-blur-md text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-300 font-bold">{activeDetectionsCount} Fires</span>
          </div>
        </div>

        {/* Desktop Brand / Header */}
        <div className="hidden md:flex pointer-events-auto items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs shadow-lg backdrop-blur-md">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-white text-xs">Wildfire Impact Tracker</span>
          </div>
        </div>

        {/* Center Banner / Status Notice (Desktop) */}
        <div className="hidden md:flex pointer-events-auto items-center justify-center">
          {isLoading ? (
            /* Loading Spinner while fetching */
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs font-semibold shadow-xl backdrop-blur-md">
              <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>Fetching NASA FIRMS VIIRS detections...</span>
            </div>
          ) : isRealDataLoaded ? (
            /* Real Data Successfully Loaded: Mock warning REMOVED */
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-700/60 text-emerald-200 text-xs font-semibold shadow-xl backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>NASA FIRMS Live:</span>
              <span className="font-normal text-emerald-300 font-mono">
                {activeDetectionsCount} detections (past 24h)
              </span>
            </div>
          ) : (
            /* Offline fallback notice when live satellites are unavailable */
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs font-semibold shadow-xl backdrop-blur-md">
              <span className="text-amber-400">⚠️ Offline Continental Telemetry Active</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
              <span className="hidden sm:inline text-[11px] font-normal text-amber-300/80 font-mono">
                {activeDetectionsCount} Hotspots
              </span>
            </div>
          )}
        </div>

        {/* Status / Quick Action Pill on Desktop */}
        <div className="hidden lg:flex pointer-events-auto items-center gap-2">
          {errorMessage && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-700/70 text-red-200 text-xs shadow-lg backdrop-blur-md cursor-pointer transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Live Feed</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs shadow-lg backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${
                isRealDataLoaded
                  ? 'bg-emerald-400 animate-pulse'
                  : errorMessage
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            ></span>
            <span className="text-zinc-300 font-medium text-[11px]">
              {isRealDataLoaded ? 'Live Satellite Feed' : 'Offline Dataset'}
            </span>
          </div>
        </div>
      </div>

      {/* Visible Error Banner if API fetch failed */}
      {errorMessage && (
        <div className="pointer-events-auto max-w-2xl w-full mx-auto px-4 py-2.5 rounded-xl bg-red-950/95 border border-red-700 text-red-100 text-xs shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-red-200 text-[11px] font-normal">{errorMessage}</span>
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white font-medium text-[11px] transition cursor-pointer flex items-center gap-1 shadow"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      )}
    </header>
  );
};
