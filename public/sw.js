// Service Worker — Staynth 360° Image Cache
// Caches panorama images for 30 days. Thumbnails and UI assets for 7 days.

const PANO_CACHE = "staynth-pano-v1";
const ASSET_CACHE = "staynth-assets-v1";

const PANO_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ASSET_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Patterns that identify a 360° panorama request
function isPano(url) {
  return (
    url.includes("panorama") ||
    url.includes("pano") ||
    url.includes("equirect") ||
    url.includes("360") ||
    // Supabase storage bucket URLs containing common image extensions
    (url.includes("supabase") && /\.(jpg|jpeg|webp|png)(\?|$)/i.test(url))
  );
}

function isThumbnail(url) {
  return url.includes("thumbnail") || url.includes("thumb");
}

// ── Install: skip waiting so new SW activates immediately ──────────────────
self.addEventListener("install", () => self.skipWaiting());

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== PANO_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Cache-first for panos, Network-first for everything else ────────
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Only handle GET image requests
  if (event.request.method !== "GET") return;
  if (!url.startsWith("http")) return;

  if (isPano(url)) {
    event.respondWith(cacheFirstWithExpiry(event.request, PANO_CACHE, PANO_MAX_AGE_MS));
    return;
  }

  if (isThumbnail(url) || /\.(jpg|jpeg|webp|png|gif|svg|ico)(\?|$)/i.test(url)) {
    event.respondWith(cacheFirstWithExpiry(event.request, ASSET_CACHE, ASSET_MAX_AGE_MS));
    return;
  }
});

// ── Cache-first strategy with max-age expiry ──────────────────────────────
async function cacheFirstWithExpiry(request, cacheName, maxAgeMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Check if cached response is still fresh using the Date header
    const dateHeader = cached.headers.get("x-cached-at");
    if (dateHeader) {
      const age = Date.now() - Number(dateHeader);
      if (age < maxAgeMs) {
        return cached; // ✅ Fresh cache hit — zero network usage
      }
    } else {
      return cached; // No timestamp header — serve it anyway
    }
  }

  // Not in cache or expired — fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone response and add our custom timestamp header before caching
      const headers = new Headers(networkResponse.headers);
      headers.set("x-cached-at", String(Date.now()));
      const cloned = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      cache.put(request, cloned);
    }
    return networkResponse;
  } catch {
    // Network failed — return stale cache if we have it
    if (cached) return cached;
    throw new Error("Network error and no cache available");
  }
}
