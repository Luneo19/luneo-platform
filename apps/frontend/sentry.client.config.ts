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
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) return null;
      if (error.name === 'AbortError') return null;
      if (error.message.includes('ResizeObserver')) return null;

      const extensionPatterns = [
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'frame_start.js',
        'frame_ant.js',
      ];
      const msg = error.message || '';
      const stack = error.stack || '';
      if (extensionPatterns.some((p) => msg.includes(p) || stack.includes(p))) {
        return null;
      }
    }

    const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
    if (frames.some((f: { filename?: string }) =>
      f.filename?.includes('chrome-extension://') ||
      f.filename?.includes('moz-extension://') ||
      f.filename?.includes('frame_start.js') ||
      f.filename?.includes('frame_ant.js')
    )) {
      return null;
    }
    
    return event;
  },

  ignoreErrors: [
    /removeChild/,
    /insertBefore/,
    /frame_start/,
    /frame_ant/,
    /Loading chunk \d+ failed/,
    /ResizeObserver loop/,
    'Non-Error promise rejection captured',
  ],

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
