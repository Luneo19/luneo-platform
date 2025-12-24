/**
 * Helpers pour transactions Supabase
 * 
 * Note: Supabase ne supporte pas les transactions multi-tables nativement
 * On utilise des fonctions SQL pour les opérations atomiques complexes
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * Exécute une fonction SQL transactionnelle Supabase
 * Utilise RPC (Remote Procedure Call) pour exécuter des fonctions PostgreSQL
 */
export async function executeTransaction<T>(
  supabase: SupabaseClient,
  functionName: string,
  params: Record<string, any>
): Promise<T> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      logger.dbError(`Transaction ${functionName} failed`, error, params);
      throw {
        status: 500,
        message: `Erreur lors de l'exécution de la transaction: ${functionName}`,
        code: 'TRANSACTION_ERROR',
        details: error.message,
      };
    }

    return data as T;
  } catch (error: any) {
    if (error.status) {
      throw error;
    }
    
    logger.error(`Transaction ${functionName} error`, error, params);
    throw {
      status: 500,
      message: 'Erreur transaction inconnue',
      code: 'TRANSACTION_ERROR',
    };
  }
}

/**
 * Helper pour créer une transaction de restauration de version
 * Crée une fonction SQL transactionnelle pour garantir l'atomicité
 */
export async function restoreDesignVersionTransaction(
  supabase: SupabaseClient,
  designId: string,
  versionId: string,
  userId: string
) {
  return executeTransaction<{ success: boolean; new_version_id: string }>(
    supabase,
    'restore_design_version_transaction',
    {
      p_design_id: designId,
      p_version_id: versionId,
      p_user_id: userId,
    }
  );
}

/**
 * Helper pour créer une transaction de suppression batch
 */
export async function deleteVersionsBatchTransaction(
  supabase: SupabaseClient,
  designId: string,
  versionIds: string[],
  userId: string
) {
  return executeTransaction<{ deleted_count: number }>(
    supabase,
    'delete_design_versions_batch',
    {
      p_design_id: designId,
      p_version_ids: versionIds,
      p_user_id: userId,
    }
  );
}

