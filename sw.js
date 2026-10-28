const CACHE_NAME = 'yandli-offline-v4';

// All HTML pages and key assets to pre-cache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard.html',
  './exams.html',
  './departments.html',
  './setup.html',
  './practice.html',
  './submit.html',
  './history.html',
  './activate.html',
  './account.html',
  './notification.html',
  './classroom.html',
  './gpa.html',
  './table.html',
  './pocket.html',
  './attendance.html',
  './hard.html',
  './analysis.html',
  './leaderboard.html',
  './profile.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. INSTALLATION: Cache files individually so if one fails, the rest still cache!
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => console.warn(`Failed to pre-cache ${url}:`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATION: Clear old cache versions automatically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: True Offline Fallback Engine
self.addEventListener('fetch', (event) => {
  // Never intercept Firebase / Firestore authentication & RTDB requests
  if (
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis') ||
    event.request.url.includes('firestore')
  ) {
    return;
  }

  // Handle HTML Page Navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Served instantly from Cache! Update in background if online
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // If exact match fails, try matching pathname (ignoring query strings like ?id=123)
        const url = new URL(event.request.url);
        return caches.match(url.pathname).then((pathMatch) => {
          if (pathMatch) return pathMatch;

          // If online, fetch from network
          return fetch(event.request).catch(() => {
            // Absolute Offline Fallback
            return caches.match('./dashboard.html') || caches.match('./index.html');
          });
        });
      })
    );
    return;
  }

  // Handle Static Assets (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Silently handle missing asset offline
        });
    })
  );
});
