import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFFromRequest } from './csrf';
import { logger } from './logger';

// Note: useCSRF hook nécessite React, donc importé dynamiquement

/**
 * Middleware CSRF pour protéger les routes API
 * TODO-048: Protection CSRF complète
 * 
 * Utilisation:
 * ```typescript
 * import { csrfMiddleware } from '@/lib/csrf-middleware';
 * 
 * export async function POST(request: NextRequest) {
 *   const csrfResponse = await csrfMiddleware(request);
 *   if (csrfResponse) return csrfResponse; // CSRF invalide
 *   
 *   // Votre logique ici
 * }
 * ```
 */
export async function csrfMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Méthodes qui nécessitent CSRF protection
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!protectedMethods.includes(request.method)) {
    return null; // Pas de protection nécessaire pour GET, HEAD, OPTIONS
  }

  // Routes publiques qui n'ont pas besoin de CSRF
  const publicRoutes = [
    '/api/auth/',
    '/api/webhooks/',
    '/api/health',
    '/api/csrf/token',
  ];

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return null; // Route publique, pas de CSRF requis
  }

  // Vérifier le token CSRF
  try {
    const isValid = await validateCSRFFromRequest(request);
    
    if (!isValid) {
      logger.warn('CSRF validation failed', {
        method: request.method,
        pathname,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid CSRF token. Please refresh the page and try again.',
          code: 'CSRF_TOKEN_INVALID',
        },
        { status: 403 }
      );
    }

    return null; // CSRF valide, continuer
  } catch (error: any) {
    logger.error('CSRF middleware error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF validation error',
        code: 'CSRF_VALIDATION_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper pour obtenir le token CSRF côté client
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      logger.error('Failed to get CSRF token', new Error(`HTTP ${response.status}`));
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    logger.error('Error fetching CSRF token', error as Error);
    return null;
  }
}

/**
 * Helper pour inclure le token CSRF dans les headers
 */
export async function withCSRFToken(
  fetchOptions: RequestInit = {}
): Promise<RequestInit> {
  const token = await getCSRFToken();
  
  return {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      'X-CSRF-Token': token || '',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };
}

/**
 * Hook React pour utiliser CSRF dans les composants
 * Note: Ce hook a été déplacé dans @/hooks/useCSRF pour éviter les erreurs SSR
 * Utilisez: import { useCSRF } from '@/hooks/useCSRF';
 */

