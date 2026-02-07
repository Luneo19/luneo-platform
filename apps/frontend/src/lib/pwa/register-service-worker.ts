/**
 * Service Worker Registration
 * Enregistre le service worker pour le PWA
 */

import { logger } from '@/lib/logger';

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            logger.info('Service Worker registered', { scope: registration.scope });
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (confirm('Une nouvelle version est disponible. Voulez-vous recharger la page ?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          logger.error(
            'Service Worker registration failed',
            error instanceof Error ? error : new Error(String(error)),
            { scope: '/service-worker.js' }
          );
        });
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

