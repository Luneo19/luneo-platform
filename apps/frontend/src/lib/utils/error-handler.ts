/**
 * ★★★ ERROR HANDLER - GESTION ERREURS AVANCÉE ★★★
 * Gestionnaire d'erreurs professionnel
 * - Classification erreurs
 * - Retry logic
 * - Error reporting
 * - User-friendly messages
 */

import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

// ========================================
// TYPES
// ========================================

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  originalError?: unknown;
  metadata?: Record<string, unknown>;
  retryable?: boolean;
  retryAfter?: number;
}

// ========================================
// ERROR CLASSIFICATION
// ========================================

/**
 * Classifie une erreur
 */
export function classifyError(error: unknown): AppError {
  // Zod validation error
  if (error instanceof ZodError) {
    return {
      type: ErrorType.VALIDATION,
      message: 'Erreurs de validation',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      originalError: error,
      metadata: {
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      retryable: false,
    };
  }

  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: 'Erreur de connexion. Vérifiez votre connexion internet.',
      code: 'NETWORK_ERROR',
      statusCode: 0,
      originalError: error,
      retryable: true,
      retryAfter: 2000,
    };
  }

  // HTTP error
  if (error && typeof error === 'object' && 'status' in error) {
    const httpError = error as { status: number; message?: string; code?: string };
    
    if (httpError.status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Vous devez être connecté pour effectuer cette action',
        code: httpError.code || 'UNAUTHORIZED',
        statusCode: 401,
        originalError: error,
        retryable: false,
      };
    }

    if (httpError.status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'Vous n\'avez pas les permissions nécessaires',
        code: httpError.code || 'FORBIDDEN',
        statusCode: 403,
        originalError: error,
        retryable: false,
      };
    }

    if (httpError.status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: 'Ressource introuvable',
        code: httpError.code || 'NOT_FOUND',
        statusCode: 404,
        originalError: error,
        retryable: false,
      };
    }

    if (httpError.status === 429) {
      return {
        type: ErrorType.RATE_LIMIT,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: httpError.code || 'RATE_LIMIT',
        statusCode: 429,
        originalError: error,
        retryable: true,
        retryAfter: 5000,
      };
    }

    if (httpError.status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: 'Erreur serveur. Veuillez réessayer plus tard.',
        code: httpError.code || 'SERVER_ERROR',
        statusCode: httpError.status,
        originalError: error,
        retryable: true,
        retryAfter: 3000,
      };
    }

    return {
      type: ErrorType.CLIENT,
      message: httpError.message || 'Erreur lors de la requête',
      code: httpError.code || 'CLIENT_ERROR',
      statusCode: httpError.status,
      originalError: error,
      retryable: false,
    };
  }

  // Error object
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'Une erreur inattendue s\'est produite',
      code: error.name,
      originalError: error,
      retryable: false,
    };
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: 'Une erreur inattendue s\'est produite',
    code: 'UNKNOWN_ERROR',
    originalError: error,
    retryable: false,
  };
}

// ========================================
// USER-FRIENDLY MESSAGES
// ========================================

/**
 * Convertit une erreur en message utilisateur
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: 'Veuillez vérifier les informations saisies',
    [ErrorType.NETWORK]: 'Problème de connexion. Vérifiez votre internet.',
    [ErrorType.AUTHENTICATION]: 'Vous devez être connecté',
    [ErrorType.AUTHORIZATION]: 'Vous n\'avez pas les permissions nécessaires',
    [ErrorType.NOT_FOUND]: 'Ressource introuvable',
    [ErrorType.RATE_LIMIT]: 'Trop de requêtes. Réessayez dans quelques instants.',
    [ErrorType.SERVER]: 'Erreur serveur. Réessayez plus tard.',
    [ErrorType.CLIENT]: 'Erreur lors de la requête',
    [ErrorType.UNKNOWN]: 'Une erreur inattendue s\'est produite',
  };

  return error.message || messages[error.type] || messages[ErrorType.UNKNOWN];
}

// ========================================
// ERROR HANDLING
// ========================================

/**
 * Gère une erreur de manière professionnelle
 */
export function handleError(error: unknown, context?: string): AppError {
  const appError = classifyError(error);

  // Log error
  logger.error('Error handled', {
    type: appError.type,
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    context,
    metadata: appError.metadata,
    originalError: appError.originalError,
  });

  // Report to error tracking service (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Integrate with Sentry if available
    if (typeof window !== 'undefined') {
      const win = window as unknown as Window & { Sentry?: { captureException: (error: unknown, options?: object) => void } };
      if (win.Sentry) {
      const Sentry = win.Sentry;
      Sentry.captureException(error, {
        level: appError.severity === 'critical' ? 'fatal' : appError.severity === 'high' ? 'error' : 'warning',
        tags: {
          errorType: appError.type,
          errorCode: appError.code,
          context,
        },
        extra: {
          appError,
          metadata: appError.metadata,
        },
      });
      }
    } else if (typeof process !== 'undefined' && (process as NodeJS.Process).env?.SENTRY_DSN) {
      // Server-side Sentry
      try {
        void import('@sentry/nextjs')
          .then((sentryModule) => {
            sentryModule.captureException(error, {
              level: appError.severity === 'critical' ? 'fatal' : appError.severity === 'high' ? 'error' : 'warning',
              tags: {
                errorType: appError.type,
                errorCode: appError.code,
                context,
              },
              extra: {
                appError,
                metadata: appError.metadata,
              },
            });
          })
          .catch((sentryError) => {
            logger.error('Sentry not available', { sentryError });
          });
      } catch (sentryError) {
        // Sentry not available, log only
        logger.error('Sentry not available', { sentryError });
      }
    }
  }

  return appError;
}

// ========================================
// RETRY LOGIC
// ========================================

/**
 * Retry une fonction avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    multiplier?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    multiplier = 2,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = classifyError(error);

      // Don't retry if not retryable
      if (!appError.retryable || attempt === maxRetries) {
        throw error;
      }

      // Call onRetry callback
      onRetry?.(attempt + 1, error);

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay with exponential backoff
      delay = Math.min(delay * multiplier, maxDelay);
    }
  }

  throw lastError;
}

// ========================================
// ERROR BOUNDARY HELPERS
// ========================================

/**
 * Vérifie si une erreur est récupérable
 */
export function isRecoverableError(error: AppError): boolean {
  return error.retryable === true && error.type !== ErrorType.AUTHENTICATION;
}

/**
 * Crée un message d'erreur pour l'UI
 * @param error - The app error
 * @param options - Optional title override (e.g. from i18n t('common.error'))
 */
export function createErrorMessage(
  error: AppError,
  options?: { title?: string }
): {
  title: string;
  message: string;
  action?: string;
} {
  const defaultTitle = options?.title ?? 'Error';
  const messages: Record<ErrorType, { title: string; message: string; action?: string }> = {
    [ErrorType.VALIDATION]: {
      title: 'Validation error',
      message: getUserFriendlyMessage(error),
    },
    [ErrorType.NETWORK]: {
      title: 'Connection problem',
      message: getUserFriendlyMessage(error),
      action: 'Retry',
    },
    [ErrorType.AUTHENTICATION]: {
      title: 'Authentication required',
      message: getUserFriendlyMessage(error),
      action: 'Sign in',
    },
    [ErrorType.AUTHORIZATION]: {
      title: 'Access denied',
      message: getUserFriendlyMessage(error),
    },
    [ErrorType.NOT_FOUND]: {
      title: 'Not found',
      message: getUserFriendlyMessage(error),
    },
    [ErrorType.RATE_LIMIT]: {
      title: 'Too many requests',
      message: getUserFriendlyMessage(error),
      action: 'Retry later',
    },
    [ErrorType.SERVER]: {
      title: 'Server error',
      message: getUserFriendlyMessage(error),
      action: 'Retry',
    },
    [ErrorType.CLIENT]: {
      title: defaultTitle,
      message: getUserFriendlyMessage(error),
    },
    [ErrorType.UNKNOWN]: {
      title: 'Unexpected error',
      message: getUserFriendlyMessage(error),
      action: 'Retry',
    },
  };

  return messages[error.type] || messages[ErrorType.UNKNOWN];
}

// ========================================

