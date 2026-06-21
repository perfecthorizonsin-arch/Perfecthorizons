// Horizon CRM — Service Worker
// Minimal, safe SW: precaches the app shell and falls back to network for
// everything else. Chrome's installability check requires a registered SW
// with a fetch event listener — that's the main thing this file provides.
// Bump CACHE_NAME whenever admin.html changes so clients pick up the new
// version instead of serving a stale cached copy.
const CACHE_NAME = 'horizon-crm-shell-v2';
const APP_SHELL = [
  './admin.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SW precache failed (non-fatal):', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation/HTML so admins always get the latest build;
// cache-first for static shell assets; everything else (Supabase API calls,
// CDN scripts, Google Drive images) just passes straight through to the
// network untouched — this SW intentionally does not intercept or cache
// API/data requests.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAppShellAsset = url.origin === self.location.origin &&
    APP_SHELL.some((path) => url.pathname.endsWith(path.replace('./', '/')));

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./admin.html'))
    );
    return;
  }

  if (isAppShellAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
  // All other requests (Supabase, CDNs, Drive images, Google Apps Script):
  // not intercepted, goes straight to network as normal.
});
