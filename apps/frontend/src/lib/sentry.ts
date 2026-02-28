/**
 * Sentry Integration
 * E-006: Configuration Sentry avec context enrichi
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

// Initialize Sentry
export function initSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    logger.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Performance
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
    
    // Filtering
    beforeSend(event, _hint) {
      // Filter out common non-issues
      const error = _hint.originalException;
      
      if (error instanceof Error) {
        // Ignore network errors from external services
        if (error.message.includes('Failed to fetch')) {
          return null;
        }
        
        // Ignore cancelled requests
        if (error.name === 'AbortError') {
          return null;
        }
        
        // Ignore extension errors
        if (error.stack?.includes('chrome-extension://')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy console logs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },
  });
}

// Set user context
export function setUser(user: {
  id: string;
  email?: string;
  name?: string;
  plan?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
  
  if (user.plan) {
    Sentry.setTag('plan', user.plan);
  }
}

// Clear user context
export function clearUser(): void {
  Sentry.setUser(null);
}

// Set custom context
export function setContext(name: string, context: Record<string, unknown>): void {
  Sentry.setContext(name, context);
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
}

// Capture exception with extra context
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

// Capture message
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

// Start transaction for performance monitoring
export function startTransaction(name: string, op: string): unknown {
  return Sentry.startSpan({ name, op }, () => {});
}

// Wrap async function with error handling
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    return await Sentry.startSpan({ name, op: 'function' }, async () => {
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { function: name },
        });
        throw error;
      }
    });
  }) as T;
}

// Export Sentry for direct access
export { Sentry };


