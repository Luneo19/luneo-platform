/**
 * Utilitaires pour les réponses API professionnelles
 * Standardise les réponses API avec gestion d'erreurs complète
 */

import { NextResponse, type NextRequest } from 'next/server';
import { logger } from './logger';
import { validateWithZod } from './validation/zod-schemas';
import { z, ZodError } from 'zod';

/**
 * Interface pour une réponse API standardisée
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Classe pour créer des réponses API professionnelles
 */
export class ApiResponseBuilder {
  /**
   * Réponse de succès
   */
  static success<T>(
    data: T,
    message?: string,
    status: number = 200,
    metadata?: Record<string, any>
  ): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        ...(metadata && { metadata }),
      },
      { status }
    );
  }

  /**
   * Réponse d'erreur
   */
  static error(
    error: string | Error,
    status: number = 500,
    code?: string,
    metadata?: Record<string, any>
  ): NextResponse<ApiResponse> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Logger l'erreur
    if (error instanceof Error) {
      logger.error('API Error', error, { status, code, metadata });
    } else {
      logger.error('API Error', new Error(errorMessage), { status, code, metadata });
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: code || `ERROR_${status}`,
        timestamp: new Date().toISOString(),
        ...(metadata && { metadata }),
      },
      { status }
    );
  }

  /**
   * Réponse 400 Bad Request
   */
  static badRequest(
    error: string,
    code?: string,
    metadata?: Record<string, any>
  ): NextResponse<ApiResponse> {
    return this.error(error, 400, code || 'BAD_REQUEST', metadata);
  }

  /**
   * Réponse 401 Unauthorized
   */
  static unauthorized(
    error: string = 'Non authentifié',
    code?: string
  ): NextResponse<ApiResponse> {
    return this.error(error, 401, code || 'UNAUTHORIZED');
  }

  /**
   * Réponse 403 Forbidden
   */
  static forbidden(
    error: string = 'Accès refusé',
    code?: string
  ): NextResponse<ApiResponse> {
    return this.error(error, 403, code || 'FORBIDDEN');
  }

  /**
   * Réponse 404 Not Found
   */
  static notFound(
    error: string = 'Ressource non trouvée',
    code?: string
  ): NextResponse<ApiResponse> {
    return this.error(error, 404, code || 'NOT_FOUND');
  }

  /**
   * Réponse 409 Conflict
   */
  static conflict(
    error: string,
    code?: string,
    metadata?: Record<string, any>
  ): NextResponse<ApiResponse> {
    return this.error(error, 409, code || 'CONFLICT', metadata);
  }

  /**
   * Réponse 422 Unprocessable Entity
   */
  static unprocessable(
    error: string,
    code?: string,
    metadata?: Record<string, any>
  ): NextResponse<ApiResponse> {
    return this.error(error, 422, code || 'UNPROCESSABLE_ENTITY', metadata);
  }

  /**
   * Réponse 429 Too Many Requests
   */
  static tooManyRequests(
    error: string = 'Trop de requêtes',
    code?: string,
    retryAfter?: number
  ): NextResponse<ApiResponse> {
    const headers: Record<string, string> = {};
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    return NextResponse.json(
      {
        success: false,
        error,
        code: code || 'TOO_MANY_REQUESTS',
        timestamp: new Date().toISOString(),
      },
      { status: 429, headers }
    );
  }

  /**
   * Réponse 500 Internal Server Error
   */
  static internalError(
    error: string | Error = 'Erreur serveur',
    code?: string,
    metadata?: Record<string, any>
  ): NextResponse<ApiResponse> {
    return this.error(error, 500, code || 'INTERNAL_ERROR', metadata);
  }

  /**
   * Réponse 503 Service Unavailable
   */
  static serviceUnavailable(
    error: string = 'Service indisponible',
    code?: string,
    retryAfter?: number
  ): NextResponse<ApiResponse> {
    const headers: Record<string, string> = {};
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    return NextResponse.json(
      {
        success: false,
        error,
        code: code || 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers }
    );
  }

  /**
   * Wrapper pour gérer les erreurs dans les handlers API
   * Supporte deux signatures:
   * 1. handle(handler, endpoint, method) - ancienne signature
   * 2. handle(handler) - nouvelle signature simplifiée
   */
  static async handle<T>(
    handler: () => Promise<T>,
    endpoint?: string,
    method: string = 'GET'
  ): Promise<NextResponse<ApiResponse<T>>> {
    try {
      const data = await handler();
      return this.success(data);
    } catch (error: any) {
      if (endpoint) {
        logger.apiError(endpoint, method, error);
      } else {
        logger.error('API Error', error instanceof Error ? error : new Error(String(error)));
      }
      
      // Gérer les erreurs connues avec status
      if (error && typeof error === 'object' && 'status' in error) {
        return this.error(
          error.message || 'Erreur',
          error.status,
          error.code
        );
      }

      // Erreur générique
      return this.internalError(error);
    }
  }

  /**
   * Valide le corps de la requête avec un schéma Zod.
   * Si la validation échoue, renvoie une réponse d'erreur 400.
   */
  static async validateWithZod<T, R = any>(
    schema: z.ZodSchema<T>,
    request: NextRequest,
    handler: (validatedData: T) => Promise<NextResponse<ApiResponse<R>>>
  ): Promise<NextResponse<ApiResponse<R>>> {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return handler(validatedData);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Zod validation failed', { errors, url: request.url });
        return ApiResponseBuilder.badRequest(
          'Erreurs de validation',
          'VALIDATION_ERROR',
          { details: errors }
        );
      }
      logger.error('Error during Zod validation or handler execution', error instanceof Error ? error : new Error(String(error)), { url: request.url });
      return ApiResponseBuilder.internalError('Erreur interne du serveur');
    }
  }
}

/**
 * Helper pour valider avec Zod
 */
export function validateWithZodSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { valid: true; data: T } | { valid: false; errors: string[] } {
  const result = validateWithZod(schema, data);
  if (result.success) {
    return { valid: true, data: result.data };
  } else {
    return { valid: false, errors: result.errors };
  }
}

/**
 * Helper pour valider les paramètres de requête (méthode legacy)
 */
export function validateRequest(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter((field) => !body[field]);
  
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  
  return { valid: true };
}

/**
 * Helper pour extraire les paramètres de pagination
 */
export function getPaginationParams(
  searchParams: URLSearchParams
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Helper pour extraire les paramètres de tri
 */
export function getSortParams(
  searchParams: URLSearchParams,
  defaultSort: string = 'created_at',
  defaultOrder: 'asc' | 'desc' = 'desc'
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sortBy = searchParams.get('sort') || defaultSort;
  const sortOrder = (searchParams.get('order') || defaultOrder) as 'asc' | 'desc';

  return { sortBy, sortOrder };
}

/**
 * Helper pour formater les erreurs de validation
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ');
}

