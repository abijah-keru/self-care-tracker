// service-worker.js
const CACHE_NAME = "selfcare-v2"; // Increment this when you want to force an update
const urlsToCache = [
  "/",
  "/index.html", 
  "/style.css",
  "/script.js",
  "/manifest.json"
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

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
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