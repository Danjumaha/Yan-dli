const CACHE_NAME = 'yan-dli-offline-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/exams.html',
  '/departments.html',
  '/setup.html',
  '/practice.html',
  '/submit.html',
  '/history.html',
  '/activate.html',
  '/account.html',
  '/notifications.html',
  '/classroom.html',
  '/gpa.html',
  '/timetables.html',
  '/attendance.html',
  '/studyroom.html',
  '/hardquestions.html',
  '/analytics.html',
  '/leaderboard.html',
  '/support.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // Never intercept Firebase, Firestore, or external API requests
  if (event.request.url.includes('firebase') || event.request.url.includes('googleapis') || event.request.url.includes('firestore')) {
    return;
  }

  // For normal page clicks and file navigation, always try network first, then fall back to cache instantly
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/dashboard.html');
        });
      })
    );
    return;
  }

  // For other static assets (CSS, JS, images), serve from cache, update in background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {});
    })
  );
});
