import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type ClipartRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/cliparts/[id]
 * Récupère un clipart par ID
 */
export async function GET(request: NextRequest, { params }: ClipartRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: clipart, error: clipartError } = await supabase
      .from('cliparts')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (clipartError || !clipart) {
      if (clipartError?.code === 'PGRST116') {
        throw { status: 404, message: 'Clipart non trouvé', code: 'CLIPART_NOT_FOUND' };
      }
      logger.dbError('fetch clipart', clipartError, { clipartId: id });
      throw { status: 500, message: 'Erreur lors de la récupération du clipart' };
    }

    // Incrémenter usage_count (non bloquant)
    const { error: updateError } = await supabase
      .from('cliparts')
      .update({ usage_count: (clipart.usage_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      logger.warn('Failed to increment clipart usage count', {
        clipartId: id,
        error: updateError,
      });
    }

    logger.info('Clipart accessed', {
      clipartId: id,
      usageCount: (clipart.usage_count || 0) + 1,
    });

    return { clipart };
  }, '/api/cliparts/[id]', 'GET');
}

/**
 * PATCH /api/cliparts/[id]
 * Met à jour un clipart
 */
export async function PATCH(request: NextRequest, { params }: ClipartRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Vérifier que le clipart existe
    const { data: existingClipart, error: checkError } = await supabase
      .from('cliparts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !existingClipart) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Clipart non trouvé', code: 'CLIPART_NOT_FOUND' };
      }
      logger.dbError('fetch clipart for update', checkError, { clipartId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du clipart' };
    }

    // Mettre à jour le clipart
    const { data: updatedClipart, error: updateError } = await supabase
      .from('cliparts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update clipart', updateError, {
        clipartId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du clipart' };
    }

    logger.info('Clipart updated', {
      clipartId: id,
      userId: user.id,
    });

    return { clipart: updatedClipart };
  }, '/api/cliparts/[id]', 'PATCH');
}

/**
 * DELETE /api/cliparts/[id]
 * Supprime un clipart
 */
export async function DELETE(request: NextRequest, { params }: ClipartRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le clipart existe
    const { data: existingClipart, error: checkError } = await supabase
      .from('cliparts')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingClipart) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Clipart non trouvé', code: 'CLIPART_NOT_FOUND' };
      }
      logger.dbError('fetch clipart for deletion', checkError, { clipartId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du clipart' };
    }

    // Supprimer le clipart
    const { error: deleteError } = await supabase.from('cliparts').delete().eq('id', id);

    if (deleteError) {
      logger.dbError('delete clipart', deleteError, {
        clipartId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du clipart' };
    }

    logger.info('Clipart deleted', {
      clipartId: id,
      userId: user.id,
    });

    return { message: 'Clipart supprimé avec succès' };
  }, '/api/cliparts/[id]', 'DELETE');
}
