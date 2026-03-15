// NutMania Service Worker v2
const CACHE = 'nutmania-v2';

// All files to pre-cache on install
const PRECACHE = [
  './',
  './noisette-clicker.html',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for local, network-first for external (fonts etc.)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isLocal = e.request.url.startsWith(self.location.origin);

  if (isLocal) {
    // Cache-first
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => caches.match('./noisette-clicker.html'));
      })
    );
  } else {
    // Network-first with cache fallback (for Google Fonts etc.)
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
