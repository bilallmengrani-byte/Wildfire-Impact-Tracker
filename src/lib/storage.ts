import { SavedPlace } from './types';

const STORAGE_KEY = 'wildfire_tracker_saved_places';

export function loadSavedPlacesFromStorage(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load saved places from localStorage:', e);
    return [];
  }
}

export function savePlaceToStorage(place: { name: string; lat: number; lng: number }): SavedPlace[] {
  try {
    const current = loadSavedPlacesFromStorage();
    const existingIndex = current.findIndex(
      (p) => Math.abs(p.lat - place.lat) < 0.001 && Math.abs(p.lng - place.lng) < 0.001
    );

    if (existingIndex !== -1) {
      return current; // Already saved
    }

    const newPlace: SavedPlace = {
      id: `place-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      savedAt: new Date().toLocaleDateString(),
    };

    const updated = [newPlace, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save place to localStorage:', e);
    return [];
  }
}

export function removeSavedPlaceFromStorage(id: string): SavedPlace[] {
  try {
    const current = loadSavedPlacesFromStorage();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to remove saved place from localStorage:', e);
    return [];
  }
}
