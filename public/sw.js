// Siliguri Fresh Mart — Service Worker
// Caches critical assets for offline, provides fast repeat loads.

const CACHE_NAME = "sfm-v2";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// Install event — precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — cache-first for assets, network-first for pages
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Don't cache API calls, analytics, or external images (CSP blocks SW fetch for external domains)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("google-analytics") ||
    url.hostname !== self.location.hostname
  ) return;

  // For pages — network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/");
        });
      })
  );
});
