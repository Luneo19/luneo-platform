import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { deleteAccountSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/gdpr/delete-account
 * Supprime définitivement le compte utilisateur et toutes ses données (RGPD Article 17)
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(deleteAccountSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { confirmation, password } = validatedData;

    // Vérifier le mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: password,
    });

    if (signInError) {
      logger.warn('Account deletion failed - incorrect password', {
        userId: user.id,
      });
      throw {
        status: 401,
        message: 'Mot de passe incorrect',
        code: 'INVALID_PASSWORD',
      };
    }

    logger.warn('Account deletion initiated', {
      userId: user.id,
      userEmail: user.email,
    });

    // Supprimer toutes les données utilisateur en parallèle
    const deletionTasks = [
      // Supprimer les designs
      supabase.from('designs').delete().eq('user_id', user.id),
      // Supprimer les commandes
      supabase.from('orders').delete().eq('user_id', user.id),
      // Supprimer les produits
      supabase.from('products').delete().eq('user_id', user.id),
      // Supprimer les collections
      supabase.from('design_collections').delete().eq('user_id', user.id),
      // Supprimer les intégrations
      supabase.from('integrations').delete().eq('user_id', user.id),
      // Supprimer les clés API
      supabase.from('api_keys').delete().eq('user_id', user.id),
      // Supprimer les favoris
      supabase.from('favorites').delete().eq('user_id', user.id),
      // Supprimer les notifications
      supabase.from('notifications').delete().eq('user_id', user.id),
      // Supprimer les téléchargements
      supabase.from('downloads').delete().eq('user_id', user.id),
      // Supprimer le profil
      supabase.from('profiles').delete().eq('id', user.id),
    ];

    const deletionResults = await Promise.allSettled(deletionTasks);

    // Logger les erreurs de suppression
    deletionResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('Data deletion error', result.reason, {
          userId: user.id,
          taskIndex: index,
        });
      }
    });

    // Supprimer le compte utilisateur dans Supabase Auth
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      logger.error('User account deletion error', deleteUserError, {
        userId: user.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la suppression du compte utilisateur',
        code: 'ACCOUNT_DELETION_ERROR',
      };
    }

    // Enregistrer la suppression dans les audit logs
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action: 'delete',
        resource_type: 'account',
        description: 'Suppression définitive du compte utilisateur (RGPD Article 17)',
        status: 'success',
        sensitivity: 'high',
      });

    if (insertError) {
      logger.warn('Failed to log account deletion', {
        userId: user.id,
        error: insertError,
      });
    }

    logger.warn('Account deleted successfully', {
      userId: user.id,
      userEmail: user.email,
    });

    return ApiResponseBuilder.success({
      message: 'Compte supprimé définitivement avec succès',
    });
  });
}
