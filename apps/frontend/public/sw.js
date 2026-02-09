// Luneo - No-op Service Worker
// This file exists to prevent 404 errors when browsers request /sw.js.
// Full PWA support with offline caching is not yet implemented.
// To enable PWA: replace this file with a proper service worker (e.g. using next-pwa).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
