/**
 * Sentry Client Configuration
 * Configuration pour le monitoring côté client
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true,
    }),
  ],

  // Filtering
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out common non-issues
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('Failed to fetch')) {
        return null;
      }
      // Cancelled requests
      if (error.name === 'AbortError') {
        return null;
      }
      // Extension errors
      if (error.stack?.includes('chrome-extension://')) {
        return null;
      }
      // ResizeObserver errors (browser quirk)
      if (error.message.includes('ResizeObserver')) {
        return null;
      }
    }
    
    return event;
  },

  // Breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter noisy console logs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },

  // Don't send errors in development by default
  enabled: process.env.NODE_ENV === 'production',
});
