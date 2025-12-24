import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type ApiKeyRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/api-keys/[id]
 * Supprime une clé API
 */
export async function DELETE(request: Request, { params }: ApiKeyRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la clé existe et appartient à l'utilisateur
    const { data: existingKey, error: checkError } = await supabase
      .from('api_keys')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingKey) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Clé API non trouvée', code: 'API_KEY_NOT_FOUND' };
      }
      logger.dbError('fetch api key for deletion', checkError, {
        apiKeyId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la clé' };
    }

    // Supprimer la clé
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete api key', deleteError, {
        apiKeyId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression de la clé' };
    }

    logger.info('API key deleted', {
      apiKeyId: id,
      userId: user.id,
      keyName: existingKey.name,
    });

    return { message: 'Clé API supprimée avec succès' };
  }, '/api/api-keys/[id]', 'DELETE');
}

/**
 * PUT /api/api-keys/[id]
 * Met à jour une clé API (activer/désactiver, renommer)
 */
export async function PUT(request: Request, { params }: ApiKeyRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const { is_active, name } = body;

    // Validation
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      throw {
        status: 400,
        message: 'Le nom de la clé ne peut pas être vide',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier que la clé existe et appartient à l'utilisateur
    const { data: existingKey, error: checkError } = await supabase
      .from('api_keys')
      .select('id, name, is_active')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingKey) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Clé API non trouvée', code: 'API_KEY_NOT_FOUND' };
      }
      logger.dbError('fetch api key for update', checkError, {
        apiKeyId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la clé' };
    }

    // Préparer les mises à jour
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    // Mettre à jour la clé
    const { data: updatedKey, error: updateError } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update api key', updateError, {
        apiKeyId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour de la clé' };
    }

    logger.info('API key updated', {
      apiKeyId: id,
      userId: user.id,
      isActive: updates.is_active,
      name: updates.name,
    });

    return {
      api_key: updatedKey,
      message: 'Clé API mise à jour avec succès',
    };
  }, '/api/api-keys/[id]', 'PUT');
}
