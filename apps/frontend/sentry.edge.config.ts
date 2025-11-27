import * as Sentry from '@sentry/nextjs';

// ============================================
// CONFIGURATION SENTRY EDGE
// Configuration pour les Edge Functions et Middleware
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
  // Sampling plus agressif pour les edge functions (exécution rapide)
  tracesSampleRate: IS_PRODUCTION ? 0.05 : 0.5,
  
  // ============================================
  // DEBUG
  // ============================================
  debug: !IS_PRODUCTION,
  
  // ============================================
  // FILTRAGE DES ERREURS
  // ============================================
  ignoreErrors: [
    // Erreurs réseau
    'ECONNRESET',
    'ETIMEDOUT',
    
    // Erreurs de middleware courantes
    'Middleware timeout',
    
    // Erreurs de rate limiting
    'Rate limit exceeded',
  ],
  
  // ============================================
  // HOOKS
  // ============================================
  
  beforeSend(event) {
    // Ajouter des tags edge
    event.tags = {
      ...event.tags,
      app: 'luneo-frontend',
      platform: 'edge',
      runtime: 'edge-runtime',
    };
    
    // Filtrer les données sensibles
    if (event.request) {
      delete event.request.cookies;
      
      if (event.request.headers) {
        const headers = event.request.headers as Record<string, string>;
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
          if (headers[header]) {
            headers[header] = '[REDACTED]';
          }
        });
      }
    }
    
    return event;
  },
});

// Export Sentry
export { Sentry };
