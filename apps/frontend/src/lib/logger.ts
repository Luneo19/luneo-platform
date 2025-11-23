/**
 * Logger professionnel pour la plateforme Luneo
 * Gère les logs en développement et production
 * Intègre Sentry pour la production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log debug (uniquement en développement)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log info (uniquement en développement)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Log warning (développement + production avec Sentry)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }

    if (this.isProduction) {
      // En production, envoyer à Sentry si configuré (uniquement pour warnings critiques)
      try {
        let Sentry: any;
        try {
          Sentry = require('@sentry/nextjs');
        } catch {
          return;
        }

        // Envoyer uniquement les warnings critiques à Sentry
        if (typeof window !== 'undefined') {
          Sentry.captureMessage(message, {
            level: 'warning',
            extra: context,
          });
        }
      } catch {
        // Sentry non disponible, ignorer silencieusement
      }
    }
  }

  /**
   * Log error (développement + production avec Sentry)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '', context || '');
    }

    if (this.isProduction) {
      // En production, envoyer à Sentry si configuré
      try {
        // Vérifier si Sentry est disponible
        let Sentry: any;
        try {
          Sentry = require('@sentry/nextjs');
        } catch {
          // Sentry non installé, ignorer
          return;
        }

        if (typeof window !== 'undefined') {
          // Client-side
          if (error instanceof Error) {
            Sentry.captureException(error, {
              extra: context,
              tags: {
                custom_message: message,
              },
            });
          } else {
            Sentry.captureMessage(message, {
              level: 'error',
              extra: { error, ...context },
            });
          }
        } else {
          // Server-side
          if (error instanceof Error) {
            Sentry.captureException(error, {
              extra: context,
              tags: {
                custom_message: message,
              },
            });
          } else {
            Sentry.captureMessage(message, {
              level: 'error',
              extra: { error, ...context },
            });
          }
        }
      } catch (err) {
        // Sentry non disponible ou erreur, ignorer silencieusement en production
        if (this.isDevelopment) {
          console.warn('Sentry logging failed:', err);
        }
      }
    }
  }

  /**
   * Log API error avec contexte complet
   */
  apiError(
    endpoint: string,
    method: string,
    error: Error | unknown,
    statusCode?: number,
    context?: LogContext
  ): void {
    const fullContext = {
      endpoint,
      method,
      statusCode,
      ...context,
    };

    this.error(`API Error: ${method} ${endpoint}`, error, fullContext);
  }

  /**
   * Log CSRF validation error
   */
  csrfError(path: string, method: string): void {
    this.warn(`CSRF validation failed: ${method} ${path}`, {
      path,
      method,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log rate limit exceeded
   */
  rateLimitError(identifier: string, limit: number): void {
    this.warn(`Rate limit exceeded: ${identifier}`, {
      identifier,
      limit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log authentication error
   */
  authError(action: string, reason?: string): void {
    this.warn(`Authentication error: ${action}`, {
      action,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database error
   */
  dbError(operation: string, error: Error | unknown, context?: LogContext): void {
    this.error(`Database error: ${operation}`, error, {
      operation,
      ...context,
    });
  }

  /**
   * Log webhook error
   */
  webhookError(platform: string, event: string, error: Error | unknown): void {
    this.error(`Webhook error: ${platform} - ${event}`, error, {
      platform,
      event,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class pour tests
export { Logger };
