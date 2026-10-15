import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Flame,
  X,
  ChevronRight,
  ShieldAlert,
  Info,
  RefreshCw,
  Trash2,
  Check,
  Filter,
  Navigation,
} from 'lucide-react';
import { FireDetection, SavedPlace, SelectedPlace, PlaceSearchResult } from '../lib/types';
import { formatDistanceMiles, calculateDistanceMiles, formatCoordinatesLabel } from '../lib/distance';
import { formatDetectionToShortTime } from '../lib/time';

interface SidebarProps {
  detections: FireDetection[];
  selectedDetection: FireDetection | null;
  onSelectDetection: (detection: FireDetection | null) => void;
  selectedPlace: SelectedPlace | null;
  onSelectPlace: (place: SelectedPlace | null) => void;
  savedPlaces: SavedPlace[];
  onSaveCurrentPlace: () => void;
  onRemoveSavedPlace: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isRealDataLoaded: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  filterWithinRangeOnly: boolean;
  onToggleFilterRange: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  detections,
  selectedDetection,
  onSelectDetection,
  selectedPlace,
  onSelectPlace,
  savedPlaces,
  onSaveCurrentPlace,
  onRemoveSavedPlace,
  isOpenMobile,
  onCloseMobile,
  isRealDataLoaded,
  onRefresh,
  isLoading,
  filterWithinRangeOnly,
  onToggleFilterRange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // When a detection marker is clicked on the map, switch to detections tab and scroll to it
  useEffect(() => {
    if (selectedDetection) {
      setActiveTab('all');
      setTimeout(() => {
        const el = document.getElementById(`sidebar-detection-${selectedDetection.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [selectedDetection]);

  // Check if current place is already saved
  const isCurrentPlaceSaved = selectedPlace
    ? savedPlaces.some(
        (p) =>
          Math.abs(p.lat - selectedPlace.lat) < 0.005 &&
          Math.abs(p.lng - selectedPlace.lng) < 0.005
      )
    : false;

  // Search places using server Nominatim geocoder or client fallback
  const performGeocode = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // 1. Try server geocode route
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const valid = data.filter(
            (item: any) =>
              item &&
              typeof item.lat === 'number' &&
              typeof item.lng === 'number' &&
              !isNaN(item.lat) &&
              !isNaN(item.lng) &&
              isFinite(item.lat) &&
              isFinite(item.lng)
          );
          setSearchResults(valid);
          return;
        }
      }

      // 2. Client fallback directly to OSM Nominatim
      const directRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query.trim()
        )}&format=json&limit=5&countrycodes=us`,
        { headers: { Accept: 'application/json' } }
      );
      if (directRes.ok) {
        const directData = await directRes.json();
        if (Array.isArray(directData)) {
          const mapped = directData
            .map((item: any) => ({
              id: String(item.place_id),
              name: item.name || item.display_name.split(',')[0],
              displayName: item.display_name,
              state: item.display_name.split(',')[1]?.trim() || '',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }))
            .filter(
              (item) =>
                !isNaN(item.lat) &&
                !isNaN(item.lng) &&
                isFinite(item.lat) &&
                isFinite(item.lng)
            );
          setSearchResults(mapped);
        }
      } else {
        setSearchError('Location not found');
      }
    } catch {
      setSearchError('Failed to search locations');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle typing with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (val.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        performGeocode(val);
      }, 350);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: PlaceSearchResult) => {
    if (
      !result ||
      typeof result.lat !== 'number' ||
      typeof result.lng !== 'number' ||
      isNaN(result.lat) ||
      isNaN(result.lng) ||
      !isFinite(result.lat) ||
      !isFinite(result.lng)
    ) {
      return;
    }

    const newPlace: SelectedPlace = {
      id: result.id,
      name: result.name,
      displayName: result.displayName || `${result.name}, ${result.state}`,
      lat: result.lat,
      lng: result.lng,
      state: result.state,
    };
    onSelectPlace(newPlace);
    setSearchResults([]);
    setSearchQuery('');

    if (window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  const handleSelectSavedPlace = (place: SavedPlace) => {
    if (
      !place ||
      typeof place.lat !== 'number' ||
      typeof place.lng !== 'number' ||
      isNaN(place.lat) ||
      isNaN(place.lng) ||
      !isFinite(place.lat) ||
      !isFinite(place.lng)
    ) {
      return;
    }

    const newPlace: SelectedPlace = {
      id: place.id,
      name: place.name,
      displayName: place.name,
      lat: place.lat,
      lng: place.lng,
    };
    onSelectPlace(newPlace);
    setActiveTab('all');

    if (window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  const inRangeDetectionsCount = detections.filter((d) => d.isWithinRange).length;

  return (
    <aside
      className={`
        fixed md:relative inset-y-0 left-0 z-[500] md:z-10
        w-80 md:w-96 max-w-[85vw] md:max-w-none
        h-full bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/80
        flex flex-col text-zinc-100 shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* Top Header / Brand */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/40">
            <Flame className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Wildfire Impact Tracker
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium">
              {isRealDataLoaded ? 'NASA FIRMS Live Feed' : 'National Fire Situation Shell'}
            </p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar Section */}
      <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/40 space-y-2.5">
        <label
          htmlFor="place-search"
          className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider"
        >
          Search a place...
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="place-search"
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                performGeocode(searchQuery);
              }
            }}
            placeholder="Search a place (e.g. Denver, Bend, Tahoe)..."
            className="w-full pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
          />
          {isSearching ? (
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
          ) : searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Live Nominatim Geocoding Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-2xl max-h-56 overflow-y-auto divide-y divide-zinc-800 text-xs z-50">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectResult(item)}
                className="w-full px-3 py-2.5 text-left hover:bg-zinc-800 flex items-start gap-2.5 transition cursor-pointer text-zinc-200"
              >
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {item.displayName || item.state}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <p className="text-[11px] text-red-400 italic">{searchError}</p>
        )}

        {/* Selected Place Badge & "Save this place" button under search bar */}
        {selectedPlace && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-700/60 flex flex-col gap-2 transition animate-in fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                    Selected Place
                  </span>
                  <h4 className="font-bold text-sm text-white truncate leading-tight">
                    {selectedPlace.name}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => onSelectPlace(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                title="Deselect location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-300 font-mono truncate">
              {selectedPlace.displayName}
            </p>

            <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between gap-2">
              {/* Requirement 2: Add "Save this place" button that stores in localStorage */}
              <button
                onClick={onSaveCurrentPlace}
                disabled={isCurrentPlaceSaved}
                className={`
                  flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow
                  ${
                    isCurrentPlaceSaved
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-600/40 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }
                `}
              >
                {isCurrentPlaceSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Place Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save this place</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-zinc-800 px-4 pt-3 text-xs font-medium gap-4 items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Detections ({detections.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved Places ({savedPlaces.length})
          </button>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh fire detections"
            className="pb-2.5 text-zinc-400 hover:text-orange-400 disabled:opacity-40 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'all' && (
          <div className="space-y-3">
            {/* Range Filter Controls when a place is selected */}
            {selectedPlace && (
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-zinc-300 font-medium">
                    Within 150 Mi: <strong className="text-amber-400">{inRangeDetectionsCount}</strong>
                  </span>
                </div>
                <button
                  onClick={onToggleFilterRange}
                  className={`
                    px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer
                    ${
                      filterWithinRangeOnly
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }
                  `}
                >
                  {filterWithinRangeOnly ? 'Filtered: <150 Mi' : 'Show Only In-Range'}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                {filterWithinRangeOnly && selectedPlace ? 'Detections &lt; 150 Miles' : 'Active Detections'}
              </span>
              <span className="bg-red-950/70 text-red-400 border border-red-800/40 px-2 py-0.5 rounded text-[10px] font-mono">
                {filterWithinRangeOnly && selectedPlace ? inRangeDetectionsCount : detections.length} Shown
              </span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-25rem)] overflow-y-auto pr-1">
              {(filterWithinRangeOnly && selectedPlace
                ? detections.filter((d) => d.isWithinRange)
                : detections
              ).map((detection) => {
                const isSelected = selectedDetection?.id === detection.id;
                const inRange = Boolean(detection.isWithinRange);
                const title = detection.name || formatCoordinatesLabel(detection.latitude, detection.longitude);

                return (
                  <div
                    key={detection.id}
                    id={`sidebar-detection-${detection.id}`}
                    onClick={() => {
                      onSelectDetection(detection);
                      if (window.innerWidth < 768) {
                        onCloseMobile();
                      }
                    }}
                    className={`
                      p-3 rounded-xl border transition-all cursor-pointer text-left
                      ${
                        isSelected
                          ? 'bg-orange-950/60 border-orange-500 ring-2 ring-orange-500 shadow-lg shadow-orange-950/50 scale-[1.01]'
                          : inRange && selectedPlace
                          ? 'bg-zinc-900/90 border-amber-600/50 hover:bg-zinc-900 hover:border-amber-500'
                          : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            inRange
                              ? 'bg-red-400 animate-pulse'
                              : detection.frp >= 50
                              ? 'bg-red-500'
                              : 'bg-orange-500'
                          }`}
                        ></span>
                        <h4 className="font-semibold text-xs text-zinc-100 leading-tight truncate">
                          {title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-zinc-400 flex-shrink-0">
                        {formatDetectionToShortTime(detection.acq_date, detection.acq_time)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-mono">
                      <span>
                        {detection.latitude.toFixed(3)}°, {detection.longitude.toFixed(3)}°
                      </span>
                      {/* Distance from selected place */}
                      {detection.distanceMiles !== undefined && selectedPlace && (
                        <span
                          className={`font-semibold text-[11px] ${
                            inRange ? 'text-amber-400 font-bold' : 'text-zinc-500'
                          }`}
                        >
                          {formatDistanceMiles(detection.distanceMiles)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-medium text-[10px]">
                          {detection.confidence} Conf.
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-orange-400 font-mono text-[10px]">
                          {detection.frp} MW
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                        Locate
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Saved Places Tab (Requirement 2: Show saved places as a list in the sidebar. Allow removing them.) */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Saved Places
              </h3>
              <span className="text-[11px] text-zinc-400 font-mono">
                {savedPlaces.length} Saved in localStorage
              </span>
            </div>

            {savedPlaces.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mb-3 text-zinc-400">
                  <Bookmark className="w-5 h-5 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-medium text-zinc-200 mb-1">
                  No saved places yet
                </h4>
                <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed mb-4">
                  Search any city, national park, or town and tap &ldquo;Save this place&rdquo; to store it here for 1-click monitoring.
                </p>
                <div className="text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Use the search bar above</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {savedPlaces.map((place) => {
                  const isCurrent =
                    selectedPlace &&
                    Math.abs(selectedPlace.lat - place.lat) < 0.005 &&
                    Math.abs(selectedPlace.lng - place.lng) < 0.005;

                  const firesWithin50 = detections.filter(
                    (d) => calculateDistanceMiles(place.lat, place.lng, d.latitude, d.longitude) <= 50.0
                  ).length;

                  return (
                    <div
                      key={place.id}
                      className={`
                        p-3 rounded-xl border transition flex items-center justify-between gap-3
                        ${
                          isCurrent
                            ? 'bg-blue-950/40 border-blue-600/70'
                            : firesWithin50 > 0
                            ? 'bg-red-950/20 border-red-800/40 hover:border-red-700/60'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                        }
                      `}
                    >
                      <button
                        onClick={() => handleSelectSavedPlace(place)}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <h4 className="text-xs font-semibold text-zinc-100 truncate">
                            {place.name}
                          </h4>
                          {firesWithin50 > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/90 text-red-300 border border-red-700/70 font-mono font-bold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping"></span>
                              {firesWithin50} in 50 mi
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {place.lat.toFixed(3)}°, {place.lng.toFixed(3)}°
                          {place.savedAt && ` • ${place.savedAt}`}
                        </p>
                      </button>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleSelectSavedPlace(place)}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition cursor-pointer"
                        >
                          View
                        </button>
                        {/* Requirement 2: Allow removing saved places */}
                        <button
                          onClick={() => onRemoveSavedPlace(place.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                          title="Remove saved place"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
          <span>Haversine 150-Mile Radius</span>
        </div>
        <span className="font-mono text-blue-400">OSM Nominatim</span>
      </div>
    </aside>
  );
};
