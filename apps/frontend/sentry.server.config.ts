import * as Sentry from '@sentry/nextjs';

// ============================================
// CONFIGURATION SENTRY SERVER
// Configuration enrichie pour le monitoring backend/SSR
// ============================================

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  
  // ============================================
  // ENVIRONNEMENT & RELEASE
  // ============================================
  environment: APP_ENVIRONMENT,
  release: `luneo-frontend@${APP_VERSION}`,
  
  // ============================================
  // SAMPLING
  // ============================================
  // Traces pour la performance SSR
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
  
  // Profiling serveur
  profilesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
  
  // ============================================
  // DEBUG
  // ============================================
  debug: !IS_PRODUCTION,
  
  // ============================================
  // INTEGRATIONS
  // ============================================
  integrations: [
    // Capture automatique des requêtes HTTP sortantes
    Sentry.httpIntegration({
      tracing: true,
    }),
    
    // Capture des erreurs non gérées
    Sentry.onUnhandledRejectionIntegration({
      mode: 'warn',
    }),
  ],
  
  // ============================================
  // FILTRAGE DES ERREURS
  // ============================================
  ignoreErrors: [
    // Erreurs réseau
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'EPIPE',
    'EHOSTUNREACH',
    
    // Erreurs Next.js courantes non critiques
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    
    // Erreurs de timeout
    'TimeoutError',
    'AbortError',
  ],
  
  // ============================================
  // HOOKS
  // ============================================
  
  beforeSend(event, hint) {
    // Filtrer les données sensibles
    if (event.request) {
      delete event.request.cookies;
      
      // Masquer les headers sensibles
      if (event.request.headers) {
        const headers = event.request.headers as Record<string, string>;
        const sensitiveHeaders = [
          'authorization',
          'x-api-key',
          'x-auth-token',
          'cookie',
          'x-forwarded-for',
          'x-real-ip',
        ];
        sensitiveHeaders.forEach(header => {
          if (headers[header]) {
            headers[header] = '[REDACTED]';
          }
        });
      }
      
      // Masquer le body si c'est une requête de login/register
      if (event.request.url?.includes('/api/auth')) {
        event.request.data = '[REDACTED]';
      }
    }
    
    // Ajouter des tags
    event.tags = {
      ...event.tags,
      app: 'luneo-frontend',
      platform: 'server',
      runtime: 'nodejs',
    };
    
    // Ajouter le contexte serveur
    event.contexts = {
      ...event.contexts,
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage?.(),
      },
    };
    
    return event;
  },
  
  beforeBreadcrumb(breadcrumb) {
    // Masquer les données sensibles dans les breadcrumbs
    if (breadcrumb.data) {
      const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
      for (const key of sensitiveKeys) {
        if (breadcrumb.data[key]) {
          breadcrumb.data[key] = '[REDACTED]';
        }
      }
    }
    
    return breadcrumb;
  },
});

// ============================================
// HELPERS SERVER
// ============================================

/**
 * Wrapper pour les API routes avec Sentry
 */
export function withSentryAPI<T>(
  handler: (req: Request) => Promise<T>,
  options: {
    name: string;
    tags?: Record<string, string>;
  }
) {
  return async (req: Request): Promise<T> => {
    return Sentry.withScope(async (scope) => {
      scope.setTag('api.route', options.name);
      
      if (options.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      // Ajouter le contexte de la requête
      scope.setContext('request', {
        url: req.url,
        method: req.method,
      });
      
      try {
        return await handler(req);
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    });
  };
}

/**
 * Capturer une erreur serveur avec contexte
 */
export function captureServerError(
  error: Error,
  context: {
    route?: string;
    method?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  } = {}
) {
  Sentry.withScope((scope) => {
    if (context.route) scope.setTag('route', context.route);
    if (context.method) scope.setTag('method', context.method);
    if (context.userId) scope.setUser({ id: context.userId });
    
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

// Export Sentry pour utilisation directe
export { Sentry };
