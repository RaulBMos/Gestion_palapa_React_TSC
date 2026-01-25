/* Service Worker enhanced configuration */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Precache injected manifest
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache strategies for offline functionality
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

// Essential files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== STATIC_CACHE && 
                   cacheName !== API_CACHE && 
                   cacheName !== HTML_CACHE;
          }).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Strategy for static assets (CacheFirst)
  if (url.pathname.match(/\.(js|css|woff2|png|jpg|jpeg|svg|ico)$/)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;
          
          return fetch(request)
            .then(response => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(request, responseToCache);
                });

              return response;
            });
        })
    );
    return;
  }

  // Strategy for API calls (NetworkFirst with fallback)
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      caches.open(API_CACHE)
        .then(cache => {
          // Try network first
          return fetch(request)
            .then(response => {
              // Cache the successful response
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // If network fails, try cache
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Strategy for HTML pages (StaleWhileRevalidate)
  if (request.destination === 'document') {
    event.respondWith(
      caches.open(HTML_CACHE)
        .then(cache => {
          const cachedResponse = cache.match(request);
          
          const networkFetch = fetch(request)
            .then(response => {
              cache.put(request, response.clone());
              return response;
            });

          return cachedResponse || networkFetch;
        })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});