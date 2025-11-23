import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { addDesignsToCollectionSchema, idSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

type CollectionItemsRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/collections/[id]/items
 * Ajoute un design à une collection
 */
export async function POST(request: Request, { params }: CollectionItemsRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la collection existe et appartient à l'utilisateur
    const { data: collection, error: collectionError } = await supabase
      .from('design_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single();

    if (collectionError || !collection) {
      logger.warn('Collection item add attempt on non-existent or unauthorized collection', {
        collectionId,
        userId: user.id,
      });
      throw { status: 404, message: 'Collection non trouvée', code: 'COLLECTION_NOT_FOUND' };
    }

    const body = await request.json();

    // Validation avec Zod
    const addItemSchema = z.object({
      design_id: idSchema,
      notes: z.string().max(500).optional(),
    });
    
    const validation = validateWithZodSchema(addItemSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      design_id: string;
      notes?: string;
    };
    const { design_id, notes } = validatedData;

    // Vérifier que le design existe et appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('custom_designs')
      .select('id, user_id')
      .eq('id', design_id)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      logger.warn('Design not found or unauthorized for collection item', {
        designId: design_id,
        userId: user.id,
      });
      throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
    }

    // Vérifier si le design n'est pas déjà dans la collection
    const { data: existingItem, error: checkError } = await supabase
      .from('design_collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('design_id', design_id)
      .single();

    if (existingItem) {
      throw {
        status: 409,
        message: 'Ce design est déjà dans la collection',
        code: 'DESIGN_ALREADY_IN_COLLECTION',
      };
    }

    // Ajouter le design à la collection
    const { data: item, error: insertError } = await supabase
      .from('design_collection_items')
      .insert({
        collection_id: collectionId,
        design_id,
        notes: notes || null,
        added_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.dbError('add design to collection', insertError, {
        collectionId,
        designId: design_id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de l\'ajout du design à la collection' };
    }

    logger.info('Design added to collection', {
      collectionId,
      designId: design_id,
      userId: user.id,
    });

    return { item };
  }, '/api/collections/[id]/items', 'POST');
}

/**
 * DELETE /api/collections/[id]/items
 * Retire un design d'une collection
 */
export async function DELETE(request: Request, { params }: CollectionItemsRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: collectionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la collection existe et appartient à l'utilisateur
    const { data: collection, error: collectionError } = await supabase
      .from('design_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single();

    if (collectionError || !collection) {
      logger.warn('Collection item remove attempt on non-existent or unauthorized collection', {
        collectionId,
        userId: user.id,
      });
      throw { status: 404, message: 'Collection non trouvée', code: 'COLLECTION_NOT_FOUND' };
    }

    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('design_id');

    // Validation avec Zod
    if (!designId) {
      throw {
        status: 400,
        message: 'Paramètre design_id manquant',
        code: 'VALIDATION_ERROR',
      };
    }

    const idValidation = validateWithZodSchema(idSchema, designId);
    if (!idValidation.valid) {
      throw {
        status: 400,
        message: `ID invalide: ${idValidation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: idValidation.errors },
      };
    }

    // Vérifier que l'item existe
    const { data: item, error: itemError } = await supabase
      .from('design_collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('design_id', designId)
      .single();

    if (itemError || !item) {
      logger.warn('Collection item not found for removal', {
        collectionId,
        designId,
        userId: user.id,
      });
      throw { status: 404, message: 'Design non trouvé dans la collection', code: 'ITEM_NOT_FOUND' };
    }

    // Supprimer l'item
    const { error: deleteError } = await supabase
      .from('design_collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('design_id', designId);

    if (deleteError) {
      logger.dbError('remove design from collection', deleteError, {
        collectionId,
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du design de la collection' };
    }

    logger.info('Design removed from collection', {
      collectionId,
      designId,
      userId: user.id,
    });

    return { message: 'Design retiré de la collection avec succès' };
  }, '/api/collections/[id]/items', 'DELETE');
}
