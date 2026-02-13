// Luneo - Service Worker
// Push notifications, notification click, install/activate, optional offline fallback.

const OFFLINE_CACHE_NAME = 'luneo-offline-v1';
const OFFLINE_URL = '/offline.html';

// --- Install: skipWaiting + cache offline page ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then((cache) => cache.add(OFFLINE_URL).catch(() => {}))
  );
});

// --- Activate: claim clients ---
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// --- Push: show notification ---
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Luneo';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: {
      url: (data.data && data.data.url) || data.url || '/',
      notificationId: (data.data && data.data.notificationId) != null ? data.data.notificationId : data.notificationId,
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// --- Notification click: focus existing window or open URL ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url != null
    ? event.notification.data.url
    : '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// --- Fetch: offline fallback for navigation ---
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(OFFLINE_URL))
      .then((response) => response || caches.match(OFFLINE_URL))
  );
});
