/**
 * Sentry Server Configuration
 * Configuration pour le monitoring côté serveur
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Integrations
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    Sentry.httpIntegration(),
  ],

  // Filtering
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    if (error instanceof Error) {
      // Filter expected errors
      if (error.message.includes('NEXT_NOT_FOUND')) {
        return null;
      }
      if (error.message.includes('NEXT_REDIRECT')) {
        return null;
      }
    }
    
    return event;
  },

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',
});
