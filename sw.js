const CACHE_NAME = 'horizon-crm-cache-v3';
const ASSETS_TO_CACHE = [
  './admin.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => { 
        if (key !== CACHE_NAME) return caches.delete(key); 
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache Supabase database calls so your lead data is always live
  if (event.request.url && event.request.url.includes('supabase.co/rest/v3')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => cachedResponse);
      
      return cachedResponse || fetchPromise; 
    })
  );
});


