import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Environment
  environment: process.env.NODE_ENV || 'production',
  
  // Ignore common errors
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
  ],
  
  beforeSend(event, _hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      
      // Mask authorization headers
      if (event.request.headers) {
        const headers = event.request.headers as any;
        if (headers.authorization) {
          headers.authorization = '[REDACTED]';
        }
        if (headers['x-api-key']) {
          headers['x-api-key'] = '[REDACTED]';
        }
      }
    }
    return event;
  },
});

