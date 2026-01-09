/**
 * ★★★ HELPER - BACKEND FORWARD ★★★
 * Helper pour forwarder les requêtes vers le backend NestJS
 * Respecte la Bible Luneo : types stricts, gestion d'erreurs complète
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { NextRequest } from 'next/server';

/**
 * Configuration du backend
 */
const getBackendUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
  // S'assurer que l'URL se termine par /api si nécessaire
  if (url.includes('api.luneo.app') || url.includes('localhost:3001')) {
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  return url;
};

/**
 * Obtient le token d'authentification depuis Supabase
 * Retourne null si Supabase n'est pas configuré ou si l'utilisateur n'est pas authentifié
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Vérifier si Supabase est configuré
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.debug('Supabase not configured, skipping auth token');
      return null;
    }

    const supabase = await createClient();
    if (!supabase) {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      logger.debug('No active session found', { error: error?.message });
      return null;
    }

    return session.access_token || null;
  } catch (error) {
    // Ne pas logger comme erreur si c'est juste une absence de config
    if (error instanceof Error && error.message.includes('Supabase')) {
      logger.debug('Supabase client creation failed', { error: error.message });
    } else {
      logger.error('Failed to get auth token', { error });
    }
    return null;
  }
}

/**
 * Interface pour les options de forward
 */
export interface ForwardOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
}

/**
 * Forward une requête vers le backend NestJS
 * 
 * @param endpoint - Endpoint backend (ex: '/ar-studio/models')
 * @param request - Requête Next.js originale
 * @param options - Options supplémentaires
 * @returns Réponse du backend
 */
export async function forwardToBackend<T = unknown>(
  endpoint: string,
  request: NextRequest,
  options: ForwardOptions & { requireAuth?: boolean } = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const backendUrl = getBackendUrl();
    const token = await getAuthToken();
    const requireAuth = options.requireAuth !== false; // Par défaut, auth requise
    
    if (requireAuth && !token) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Construire l'URL avec query params
    const url = new URL(`${backendUrl}${endpoint}`);
    if (options.queryParams) {
      Object.entries(options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    // Extraire query params de la requête originale
    const requestUrl = new URL(request.url);
    requestUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Préparer le body
    let body: BodyInit | undefined;
    const method = options.method || request.method;
    
    if (method !== 'GET' && method !== 'DELETE') {
      if (options.body) {
        // Si c'est FormData, on le garde tel quel
        if (options.body instanceof FormData) {
          body = options.body;
        } else {
          body = JSON.stringify(options.body);
        }
      } else {
        // Vérifier si la requête contient FormData
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('multipart/form-data')) {
          body = await request.formData();
        } else {
          try {
            const requestBody = await request.json();
            body = JSON.stringify(requestBody);
          } catch {
            // Pas de body dans la requête
          }
        }
      }
    }

    // Headers
    const headers: Record<string, string> = {
      ...options.headers,
    };
    
    // Ajouter le token seulement s'il existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set Content-Type header for JSON bodies (pas pour FormData)
    if (body && typeof body === 'string') {
      headers['Content-Type'] = 'application/json';
    }
    // Pour FormData, ne pas mettre Content-Type, le browser le fait automatiquement avec le boundary

    // Forwarder la requête
    logger.info('Forwarding request to backend', {
      endpoint,
      method,
      url: url.toString(),
      hasBody: !!body,
      isFormData: body instanceof FormData,
    });

    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    const responseData = await response.json();

    if (!response.ok) {
      logger.error('Backend request failed', {
        endpoint,
        method,
        status: response.status,
        error: responseData,
      });
      
      throw {
        status: response.status,
        message: responseData.message || responseData.error || 'Erreur backend',
        code: responseData.code || 'BACKEND_ERROR',
        data: responseData,
      };
    }

    logger.info('Backend request successful', {
      endpoint,
      method,
      status: response.status,
    });

    return {
      success: true,
      data: responseData.data || responseData,
      message: responseData.message,
    };
  } catch (error) {
    logger.error('Error forwarding to backend', {
      error,
      endpoint,
      method: options.method || request.method,
    });

    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }

    throw {
      status: 500,
      message: 'Erreur lors de la communication avec le backend',
      code: 'BACKEND_CONNECTION_ERROR',
    };
  }
}

/**
 * Helper pour GET requests
 */
export async function forwardGet<T = unknown>(
  endpoint: string,
  request: NextRequest,
  queryParams?: Record<string, string | number | boolean>,
  options?: { requireAuth?: boolean }
): Promise<{ success: boolean; data?: T; error?: string }> {
  return forwardToBackend<T>(endpoint, request, {
    method: 'GET',
    queryParams,
    requireAuth: options?.requireAuth,
  });
}

/**
 * Helper pour POST requests
 */
export async function forwardPost<T = unknown>(
  endpoint: string,
  request: NextRequest,
  body?: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
  return forwardToBackend<T>(endpoint, request, {
    method: 'POST',
    body,
  });
}

/**
 * Helper pour PUT requests
 */
export async function forwardPut<T = unknown>(
  endpoint: string,
  request: NextRequest,
  body?: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
  return forwardToBackend<T>(endpoint, request, {
    method: 'PUT',
    body,
  });
}

/**
 * Helper pour PATCH requests
 */
export async function forwardPatch<T = unknown>(
  endpoint: string,
  request: NextRequest,
  body?: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
  return forwardToBackend<T>(endpoint, request, {
    method: 'PATCH',
    body,
  });
}

/**
 * Helper pour DELETE requests
 */
export async function forwardDelete<T = unknown>(
  endpoint: string,
  request: NextRequest
): Promise<{ success: boolean; data?: T; error?: string }> {
  return forwardToBackend<T>(endpoint, request, {
    method: 'DELETE',
  });
}

