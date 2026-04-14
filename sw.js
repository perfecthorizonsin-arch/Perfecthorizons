const CACHE_NAME = 'horizon-crm-cache-v1';
const CACHE_NAME = 'horizon-crm-cache-v1';
const ASSETS_TO_CACHE = [
  './admin.html',
  './manifest.json',
  './icon.png'
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
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
  if (event.request.url.includes('supabase.co/rest/v1')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse; // FIXED TYPO HERE
      }).catch(() => cachedResponse);
      
      return cachedResponse || fetchPromise; 
    })
  );
});
