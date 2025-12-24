import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/settings/sessions
 * Récupère toutes les sessions actives de l'utilisateur
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer toutes les sessions depuis Supabase Auth
    // Note: Supabase Auth ne fournit pas directement une API pour lister les sessions
    // On utilise la session actuelle et on peut stocker les sessions dans une table custom
    const { data: { session } } = await supabase.auth.getSession();

    // Pour une implémentation complète, il faudrait une table `user_sessions`
    // Pour l'instant, on retourne la session actuelle
    const sessions = session
      ? [
          {
            id: session.access_token?.substring(0, 20) || 'current',
            user_id: user.id,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            ip_address: null, // À récupérer depuis les headers si disponible
            user_agent: null, // À récupérer depuis les headers si disponible
            is_current: true,
          },
        ]
      : [];

    return { sessions };
  }, '/api/settings/sessions', 'GET');
}

/**
 * DELETE /api/settings/sessions
 * Supprime une session spécifique ou toutes les sessions sauf la actuelle
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Déconnecter toutes les sessions sauf la actuelle
      // Note: Supabase Auth ne permet pas de déconnecter toutes les sessions directement
      // Il faudrait implémenter une table custom pour gérer les sessions
      logger.info('Delete all sessions requested', { userId: user.id });
      
      // Pour l'instant, on retourne un succès
      // Une implémentation complète nécessiterait une table `user_sessions`
      return { message: 'Toutes les sessions ont été supprimées (fonctionnalité à implémenter)' };
    }

    if (sessionId) {
      // Supprimer une session spécifique
      // Note: Supabase Auth ne permet pas de supprimer une session spécifique directement
      // Il faudrait implémenter une table custom pour gérer les sessions
      logger.info('Delete specific session requested', {
        userId: user.id,
        sessionId,
      });

      // Pour l'instant, on retourne un succès
      // Une implémentation complète nécessiterait une table `user_sessions`
      return { message: 'Session supprimée (fonctionnalité à implémenter)' };
    }

    throw {
      status: 400,
      message: 'Paramètre session_id ou all requis',
      code: 'VALIDATION_ERROR',
    };
  }, '/api/settings/sessions', 'DELETE');
}
