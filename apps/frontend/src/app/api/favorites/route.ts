import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { addFavoriteSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/favorites
 * Récupère les favoris de l'utilisateur avec pagination
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const resourceType = searchParams.get('type'); // 'design', 'template', 'clipart'

    // Construire la requête
    let query = supabase
      .from('favorites')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Filtrer par type de ressource si spécifié
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    // Appliquer le tri et la pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: favorites, error: favoritesError, count } = await query;

    if (favoritesError) {
      logger.dbError('fetch favorites', favoritesError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des favoris' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Favorites fetched', {
      userId: user.id,
      count: favorites?.length || 0,
      total: count || 0,
      resourceType,
    });

    return {
      favorites: favorites || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, '/api/favorites', 'GET');
}

/**
 * POST /api/favorites
 * Ajoute un favori
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(addFavoriteSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      resource_id: string;
      resource_type: 'design' | 'template' | 'clipart' | 'product';
    };
    const { resource_id, resource_type } = validatedData;

    // Vérifier si le favori existe déjà
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('resource_id', resource_id)
      .eq('resource_type', resource_type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.dbError('check existing favorite', checkError, {
        userId: user.id,
        resourceId: resource_id,
        resourceType: resource_type,
      });
    }

    if (existingFavorite) {
      throw {
        status: 409,
        message: 'Cette ressource est déjà dans vos favoris',
        code: 'FAVORITE_ALREADY_EXISTS',
      };
    }

    // Créer le favori
    const { data: createdFavorite, error: createError } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        resource_id: resource_id,
        resource_type: resource_type,
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create favorite', createError, {
        userId: user.id,
        resourceId: resource_id,
        resourceType: resource_type,
      });
      throw { status: 500, message: 'Erreur lors de l\'ajout du favori' };
    }

    logger.info('Favorite added', {
      userId: user.id,
      favoriteId: createdFavorite.id,
      resourceId: resource_id,
      resourceType: resource_type,
    });

    return {
      favorite: createdFavorite,
      message: 'Favori ajouté avec succès',
    };
  }, '/api/favorites', 'POST');
}

/**
 * DELETE /api/favorites?id=xxx
 * Supprime un favori
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('id');

    if (!favoriteId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier que le favori existe et appartient à l'utilisateur
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id, resource_id, resource_type')
      .eq('id', favoriteId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingFavorite) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Favori non trouvé', code: 'FAVORITE_NOT_FOUND' };
      }
      logger.dbError('fetch favorite for deletion', checkError, {
        favoriteId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du favori' };
    }

    // Supprimer le favori
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete favorite', deleteError, {
        favoriteId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du favori' };
    }

    logger.info('Favorite deleted', {
      favoriteId,
      userId: user.id,
      resourceId: existingFavorite.resource_id,
      resourceType: existingFavorite.resource_type,
    });

    return { message: 'Favori supprimé avec succès' };
  }, '/api/favorites', 'DELETE');
}
