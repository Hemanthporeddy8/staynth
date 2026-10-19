/**
 * Staynth client-side caching utilities
 * - localStorage: search history (30 days), recently viewed properties (30 days)
 * - Service Worker: 360° panorama images (30 days), thumbnails (7 days)
 */

const HISTORY_KEY = "staynth_search_history";
const VIEWED_KEY = "staynth_viewed_properties";
const MAX_HISTORY = 8;
const MAX_VIEWED = 20;
const TTL_30D = 30 * 24 * 60 * 60 * 1000;

// ── Types ──────────────────────────────────────────────────────────────────

export interface SearchEntry {
  city: string;
  listingType: string;
  stayType: string;
  guests: string;
  at: number; // timestamp
}

export interface ViewedEntry {
  id: number;
  title: string;
  city: string;
  price: number;
  coverImage: string;
  at: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function readJSON<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const items: (T & { at: number })[] = JSON.parse(raw);
    // Auto-prune expired entries (older than 30 days)
    const fresh = items.filter((item) => Date.now() - item.at < TTL_30D);
    return fresh as T[];
  } catch {
    return [];
  }
}

function writeJSON<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage full — clear and retry
    localStorage.removeItem(key);
  }
}

// ── Search History ─────────────────────────────────────────────────────────

export function getSearchHistory(): SearchEntry[] {
  return readJSON<SearchEntry>(HISTORY_KEY);
}

export function pushSearchHistory(entry: Omit<SearchEntry, "at">): void {
  const items = getSearchHistory();
  // Remove duplicate same-city entry
  const deduped = items.filter((i) => i.city.toLowerCase() !== entry.city.toLowerCase());
  const updated: SearchEntry[] = [{ ...entry, at: Date.now() }, ...deduped].slice(0, MAX_HISTORY);
  writeJSON(HISTORY_KEY, updated);
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

// ── Recently Viewed Properties ─────────────────────────────────────────────

export function getViewedProperties(): ViewedEntry[] {
  return readJSON<ViewedEntry>(VIEWED_KEY);
}

export function pushViewedProperty(entry: Omit<ViewedEntry, "at">): void {
  const items = getViewedProperties();
  const deduped = items.filter((i) => i.id !== entry.id);
  const updated: ViewedEntry[] = [{ ...entry, at: Date.now() }, ...deduped].slice(0, MAX_VIEWED);
  writeJSON(VIEWED_KEY, updated);
}

// ── Service Worker Registration ────────────────────────────────────────────

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered, scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  });
}
