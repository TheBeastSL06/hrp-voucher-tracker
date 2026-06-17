const CACHE = 'hrp-v6';
const STATIC = [
  './icons/icon-72.png','./icons/icon-96.png','./icons/icon-128.png',
  './icons/icon-144.png','./icons/icon-152.png','./icons/icon-192.png',
  './icons/icon-384.png','./icons/icon-512.png','./manifest.json'
];

// On install: pre-cache only static assets (icons + manifest), NOT index.html
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

// On activate: wipe old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Firebase requests: always network only (never cache)
// - index.html: network-first, no caching (always fresh)
// - Static assets (icons, manifest): cache-first
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase — never intercept
  if (url.includes('firestore') || url.includes('firebase') ||
      url.includes('googleapis') || url.includes('gstatic')) return;

  // index.html — network first, no cache fallback (always fresh)
  if (url.endsWith('/') || url.endsWith('index.html') || url.endsWith('hrp-voucher-tracker/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }

  // Static assets — cache first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
