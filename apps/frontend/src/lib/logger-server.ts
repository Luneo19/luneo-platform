/**
 * Server-side Logger for Next.js Server Components and API Routes
 * FE-04: Logger compatible avec les Server Components
 * 
 * This logger is designed to work in server-side contexts where
 * client-side Sentry is not available.
 */

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Server-side logger singleton
 * Uses console methods but respects environment settings
 */
export const serverLogger = {
  /**
   * Debug logs (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context ?? '');
    }
  },

  /**
   * Info logs (development only)
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context ?? '');
    }
  },

  /**
   * Warning logs
   */
  warn(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context ?? '');
    }
    // In production, warnings could be sent to a server-side logging service
    if (isProduction) {
      // Could integrate with server-side Sentry, Winston, or other logging service
      // For now, we suppress non-critical warnings in production
    }
  },

  /**
   * Error logs
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error ?? '', context ?? '');
    }
    
    // In production, errors should still be logged to a service
    if (isProduction) {
      // Server-side Sentry integration
      try {
        const Sentry = require('@sentry/nextjs');
        if (error instanceof Error) {
          Sentry.captureException(error, {
            extra: { message, ...context },
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: { error, ...context },
          });
        }
      } catch {
        // Sentry not available, log to stderr for container logging
        console.error(`[SERVER ERROR] ${message}`, error ?? '', context ?? '');
      }
    }
  },

  /**
   * API error with endpoint context
   */
  apiError(endpoint: string, method: string, error: Error | unknown, statusCode?: number): void {
    this.error(`API Error: ${method} ${endpoint}`, error, {
      endpoint,
      method,
      statusCode,
    });
  },

  /**
   * Auth error
   */
  authError(action: string, reason?: string): void {
    this.warn(`Auth error: ${action}`, { action, reason });
  },

  /**
   * Database error
   */
  dbError(operation: string, error: Error | unknown): void {
    this.error(`Database error: ${operation}`, error, { operation });
  },
};

// Export default for convenience
export default serverLogger;
