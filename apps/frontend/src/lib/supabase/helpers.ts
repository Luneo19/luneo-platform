/**
 * Helpers pour Supabase - Standardisation de la gestion des erreurs
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Gère les résultats de requêtes Supabase avec .single()
 * Standardise la gestion des erreurs pour tous les endpoints
 */
export function handleSupabaseSingle<T>(result: {
  data: T | null;
  error: PostgrestError | null;
}): T {
  if (result.error) {
    // PGRST116 = No rows returned (Supabase)
    if (result.error.code === 'PGRST116') {
      throw {
        status: 404,
        message: 'Ressource non trouvée',
        code: 'NOT_FOUND',
      };
    }
    // Autres erreurs DB
    throw {
      status: 500,
      message: 'Erreur base de données',
      code: 'DB_ERROR',
      details: result.error.message,
    };
  }

  if (!result.data) {
    throw {
      status: 404,
      message: 'Ressource non trouvée',
      code: 'NOT_FOUND',
    };
  }

  return result.data;
}

/**
 * Gère les résultats de requêtes Supabase avec .maybeSingle()
 * Retourne null si aucune ressource trouvée (au lieu de lancer une erreur)
 */
export function handleSupabaseMaybeSingle<T>(result: {
  data: T | null;
  error: PostgrestError | null;
}): T | null {
  if (result.error && result.error.code !== 'PGRST116') {
    throw {
      status: 500,
      message: 'Erreur base de données',
      code: 'DB_ERROR',
      details: result.error.message,
    };
  }

  return result.data || null;
}

/**
 * Gère les résultats de requêtes Supabase avec pagination
 */
export function handleSupabaseList<T>(result: {
  data: T[] | null;
  error: PostgrestError | null;
  count?: number | null;
}): { data: T[]; count: number } {
  if (result.error) {
    throw {
      status: 500,
      message: 'Erreur base de données',
      code: 'DB_ERROR',
      details: result.error.message,
    };
  }

  return {
    data: result.data || [],
    count: result.count || 0,
  };
}

/**
 * Valide un UUID avec Zod
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!id || !uuidRegex.test(id)) {
    throw {
      status: 400,
      message: `${fieldName} invalide (format UUID requis)`,
      code: 'INVALID_UUID',
    };
  }
}

