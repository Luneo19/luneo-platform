import * as Sentry from '@sentry/nextjs';

// ============================================
// CONFIGURATION SENTRY CLIENT
// Configuration enrichie pour le monitoring frontend
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
  // Traces pour la performance
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
  
  // Profiling (performance avancée)
  profilesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
  
  // Session Replay
  replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreur
  replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0.5,
  
  // ============================================
  // DEBUG
  // ============================================
  debug: !IS_PRODUCTION,
  
  // ============================================
  // INTEGRATIONS
  // ============================================
  integrations: [
    // Session Replay avec masquage des données sensibles
    Sentry.replayIntegration({
      maskAllText: IS_PRODUCTION,
      blockAllMedia: IS_PRODUCTION,
      maskAllInputs: true,
      // Ne pas masquer les éléments UI importants
      unmask: ['.sentry-unmask', '[data-sentry-unmask]'],
    }),
    
    // Breadcrumbs personnalisés
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),
    
    // Http tracking amélioré
    Sentry.httpClientIntegration({
      failedRequestStatusCodes: [[400, 599]],
      failedRequestTargets: [/.*/],
    }),
    
    // Browser Tracing pour la performance
    Sentry.browserTracingIntegration({
      // Traces pour les routes
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.luneo\.app/,
        /^https:\/\/api\.luneo\.app/,
      ],
    }),
  ],
  
  // ============================================
  // FILTRAGE DES ERREURS
  // ============================================
  ignoreErrors: [
    // Extensions navigateur
    'top.GLOBALS',
    'chrome-extension',
    'moz-extension',
    'safari-extension',
    
    // Erreurs réseau courantes
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    'Network request failed',
    'AbortError',
    'TypeError: cancelled',
    
    // Erreurs de script tiers
    /^Script error\.?$/,
    /^Javascript error: Script error\.? on line 0$/,
    
    // Hydration errors (Next.js)
    'Hydration failed',
    'There was an error while hydrating',
    'Text content does not match',
    
    // ResizeObserver (souvent des faux positifs)
    'ResizeObserver loop',
    'ResizeObserver loop completed with undelivered notifications',
    
    // Erreurs de navigateur non critiques
    'Non-Error promise rejection captured',
    'Object Not Found Matching Id',
    
    // Erreurs de permission
    'NotAllowedError',
    
    // Erreurs de quota de stockage
    'QuotaExceededError',
  ],
  
  // Ignorer certaines URLs
  denyUrls: [
    // Extensions Chrome
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    
    // Extensions Firefox
    /^moz-extension:\/\//i,
    
    // Extensions Safari
    /^safari-extension:\/\//i,
    
    // Scripts tiers
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /doubleclick\.net/i,
    /hotjar\.com/i,
    /intercom\.io/i,
    /crisp\.chat/i,
    /facebook\.net/i,
    /twitter\.com/i,
  ],
  
  // ============================================
  // HOOKS
  // ============================================
  
  // Avant l'envoi d'un événement
  beforeSend(event, hint) {
    // Filtrer les données sensibles
    if (event.request) {
      delete event.request.cookies;
      
      // Masquer les headers sensibles
      if (event.request.headers) {
        const headers = event.request.headers as Record<string, string>;
        const sensitiveHeaders = ['authorization', 'x-api-key', 'x-auth-token', 'cookie'];
        sensitiveHeaders.forEach(header => {
          if (headers[header]) {
            headers[header] = '[REDACTED]';
          }
        });
      }
    }
    
    // Ajouter des tags utiles
    event.tags = {
      ...event.tags,
      app: 'luneo-frontend',
      platform: 'web',
    };
    
    // Ajouter le viewport pour le debug responsive
    if (typeof window !== 'undefined') {
      event.contexts = {
        ...event.contexts,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        device: {
          online: navigator.onLine,
          language: navigator.language,
          userAgent: navigator.userAgent,
        },
      };
    }
    
    // Ne pas envoyer en dev (optionnel)
    // if (!IS_PRODUCTION) return null;
    
    return event;
  },
  
  // Avant l'envoi d'un breadcrumb
  beforeBreadcrumb(breadcrumb, hint) {
    // Filtrer les breadcrumbs de console en production
    if (IS_PRODUCTION && breadcrumb.category === 'console') {
      return null;
    }
    
    // Masquer les données sensibles dans les fetch
    if (breadcrumb.category === 'fetch' && breadcrumb.data) {
      if (breadcrumb.data.url?.includes('password')) {
        breadcrumb.data.body = '[REDACTED]';
      }
    }
    
    return breadcrumb;
  },
});

// ============================================
// HELPERS POUR ENRICHIR LE CONTEXTE
// ============================================

/**
 * Définir l'utilisateur courant pour Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  plan?: string;
} | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      // Context supplémentaire
      plan: user.plan,
    } as Sentry.User);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Ajouter des tags globaux
 */
export function setSentryTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Ajouter un contexte personnalisé
 */
export function setSentryContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}

/**
 * Ajouter un breadcrumb personnalisé
 */
export function addSentryBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}) {
  Sentry.addBreadcrumb({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capturer une erreur avec contexte enrichi
 */
export function captureErrorWithContext(
  error: Error,
  context: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
    user?: { id: string; email?: string };
  } = {}
) {
  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context.level) {
      scope.setLevel(context.level);
    }
    
    if (context.user) {
      scope.setUser(context.user as Sentry.User);
    }
    
    Sentry.captureException(error);
  });
}

/**
 * Créer une transaction de performance
 */
export function startSentryTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
    forceTransaction: true,
  });
}

// Export Sentry pour utilisation directe
export { Sentry };
