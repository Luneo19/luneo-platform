import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { updateCollectionSchema } from '@/lib/validation/zod-schemas';

type CollectionRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/collections/[id]
 * Récupère une collection avec ses designs
 */
export async function GET(request: Request, { params }: CollectionRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer la collection
    const { data: collection, error: collectionError } = await supabase
      .from('design_collections')
      .select('*')
      .eq('id', id)
      .single();

    if (collectionError || !collection) {
      logger.dbError('fetch collection', collectionError, { collectionId: id });
      throw { status: 404, message: 'Collection non trouvée', code: 'COLLECTION_NOT_FOUND' };
    }

    // Vérifier les permissions
    if (collection.user_id !== user.id && !collection.is_public) {
      logger.warn('Unauthorized collection access attempt', {
        collectionId: id,
        userId: user.id,
        collectionOwnerId: collection.user_id,
      });
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    // Récupérer les designs de la collection
    const { data: items, error: itemsError } = await supabase
      .from('design_collection_items')
      .select(`
        *,
        design:custom_designs(*)
      `)
      .eq('collection_id', id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      logger.dbError('fetch collection items', itemsError, { collectionId: id });
      throw { status: 500, message: 'Erreur lors de la récupération des designs' };
    }

    const designs = items?.map((item: any) => item.design).filter(Boolean) || [];

    return {
      collection: {
        ...collection,
        designs_count: designs.length,
      },
      designs,
      items: items || [],
    };
  }, '/api/collections/[id]', 'GET');
}

/**
 * PUT /api/collections/[id]
 * Met à jour une collection
 */
export async function PUT(request: Request, { params }: CollectionRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la collection existe et appartient à l'utilisateur
    const { data: existingCollection, error: fetchError } = await supabase
      .from('design_collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingCollection) {
      logger.warn('Collection update attempt on non-existent or unauthorized collection', {
        collectionId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Collection non trouvée', code: 'COLLECTION_NOT_FOUND' };
    }

    const body = await request.json();

    // Validation avec Zod (schéma partiel pour update)
    const validation = validateWithZodSchema(updateCollectionSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const { name, description, color, is_public, tags, sort_order } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description || null;
    if (color !== undefined) updateData.color = color;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedCollection, error: updateError } = await supabase
      .from('design_collections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update collection', updateError, { collectionId: id, userId: user.id });
      
      // Handle unique constraint violation
      if (updateError.code === '23505') {
        throw {
          status: 409,
          message: 'Une collection avec ce nom existe déjà',
          code: 'DUPLICATE_COLLECTION',
        };
      }

      throw { status: 500, message: 'Erreur lors de la mise à jour de la collection' };
    }

    logger.info('Collection updated', { collectionId: id, userId: user.id });

    return { collection: updatedCollection };
  }, '/api/collections/[id]', 'PUT');
}

/**
 * DELETE /api/collections/[id]
 * Supprime une collection
 */
export async function DELETE(request: Request, { params }: CollectionRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la collection existe et appartient à l'utilisateur
    const { data: collection, error: fetchError } = await supabase
      .from('design_collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !collection) {
      logger.warn('Collection delete attempt on non-existent or unauthorized collection', {
        collectionId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Collection non trouvée', code: 'COLLECTION_NOT_FOUND' };
    }

    // Supprimer d'abord les items de la collection
    const { error: deleteItemsError } = await supabase
      .from('design_collection_items')
      .delete()
      .eq('collection_id', id);

    if (deleteItemsError) {
      logger.dbError('delete collection items', deleteItemsError, { collectionId: id });
      throw { status: 500, message: 'Erreur lors de la suppression des designs de la collection' };
    }

    // Supprimer la collection
    const { error: deleteError } = await supabase
      .from('design_collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete collection', deleteError, { collectionId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la suppression de la collection' };
    }

    logger.info('Collection deleted', { collectionId: id, userId: user.id });

    return { message: 'Collection supprimée avec succès' };
  }, '/api/collections/[id]', 'DELETE');
}
