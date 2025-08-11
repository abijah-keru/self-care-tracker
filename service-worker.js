// service-worker.js (scoped to /self-care-tracker/)
const CACHE_NAME = "selfcare-tracker-v8t "; // Update to invalidate old caches

// Compute scope-aware base path for this service worker file
const SCOPE_PATH = new URL('./', self.location).pathname; // e.g., "/self-care-tracker/"

const urlsToCache = [
  SCOPE_PATH,
  SCOPE_PATH + "index.html",
  SCOPE_PATH + "style.css",
  SCOPE_PATH + "script.js",
  SCOPE_PATH + "manifest.json",
  SCOPE_PATH + "icons/icon-192.png",
  SCOPE_PATH + "icons/icon-512.png",
];

// Install event - cache resources
self.addEventListener("install", event => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting(); // Activate new SW immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Fetch event
// - HTML (navigation): network-first with cache fallback to ensure updates show without manual cache bump
// - Static assets (CSS/JS/images): stale-while-revalidate to keep assets fresh in background
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return; // bypass non-GET

  const acceptHeader = request.headers.get('accept') || '';
  const isHTMLRequest = request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isHTMLRequest) {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback to app shell
        return caches.match(SCOPE_PATH + 'index.html');
      }
    })());
    return;
  }

  // Stale-while-revalidate for non-HTML
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request)
      .then((networkResponse) => {
        // Only cache successful basic responses
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      })
      .catch(() => cached);
    return cached || fetchPromise;
  })());
});

// Listen for skip waiting message from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('Service Worker: Received skipWaiting message');
    self.skipWaiting();
  }
});

// Notify clients about updates
self.addEventListener('controllerchange', () => {
  console.log('Service Worker: Controller changed');
});