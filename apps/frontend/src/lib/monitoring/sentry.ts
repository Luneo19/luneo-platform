/**
 * ★★★ SENTRY CONFIGURATION ★★★
 * Configuration Sentry pour error tracking et performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (typeof window === 'undefined') {
    // Server-side initialization
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      integrations: [
        Sentry.httpIntegration(),
      ],
    });
  } else {
    // Client-side initialization
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.['authorization'];
        }
        return event;
      },
    });
  }
}

/**
 * Capture une exception
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture un message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Ajoute du contexte utilisateur
 */
export function setUserContext(user: { id: string; email?: string; name?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Ajoute du contexte additionnel
 */
export function setContext(key: string, context: Record<string, unknown>) {
  Sentry.setContext(key, context);
}

/**
 * Crée un span pour le performance monitoring
 */
export function startSpan<T>(name: string, callback: (span: Sentry.Span) => T): T {
  return Sentry.startSpan({ name }, callback);
}

