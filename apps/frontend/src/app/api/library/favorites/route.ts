import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { addLibraryFavoriteSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/library/favorites
 * Récupère les favoris de la bibliothèque avec pagination
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
    const resourceType = searchParams.get('type'); // 'template', 'clipart'

    // Construire la requête pour récupérer les favoris de la bibliothèque
    let query = supabase
      .from('library_favorites')
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
      logger.dbError('fetch library favorites', favoritesError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des favoris de la bibliothèque' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Library favorites fetched', {
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
  }, '/api/library/favorites', 'GET');
}

/**
 * POST /api/library/favorites
 * Ajoute un favori à la bibliothèque
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = addLibraryFavoriteSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { resource_id, resource_type } = validation.data;

    // Vérifier si le favori existe déjà
    const { data: existingFavorite, error: checkError } = await supabase
      .from('library_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('resource_id', resource_id)
      .eq('resource_type', resource_type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.dbError('check existing library favorite', checkError, {
        userId: user.id,
        resourceId: resource_id,
        resourceType: resource_type,
      });
    }

    if (existingFavorite) {
      throw {
        status: 409,
        message: 'Cette ressource est déjà dans vos favoris de la bibliothèque',
        code: 'FAVORITE_ALREADY_EXISTS',
      };
    }

    // Créer le favori
    const { data: createdFavorite, error: createError } = await supabase
      .from('library_favorites')
      .insert({
        user_id: user.id,
        resource_id: resource_id,
        resource_type: resource_type,
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create library favorite', createError, {
        userId: user.id,
        resourceId: resource_id,
        resourceType: resource_type,
      });
      throw { status: 500, message: 'Erreur lors de l\'ajout du favori' };
    }

    logger.info('Library favorite added', {
      userId: user.id,
      favoriteId: createdFavorite.id,
      resourceId: resource_id,
      resourceType: resource_type,
    });

    return {
      favorite: createdFavorite,
      message: 'Favori ajouté à la bibliothèque avec succès',
    };
  }, '/api/library/favorites', 'POST');
}

/**
 * DELETE /api/library/favorites?id=xxx
 * Supprime un favori de la bibliothèque
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
      .from('library_favorites')
      .select('id, resource_id, resource_type')
      .eq('id', favoriteId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingFavorite) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Favori non trouvé', code: 'FAVORITE_NOT_FOUND' };
      }
      logger.dbError('fetch library favorite for deletion', checkError, {
        favoriteId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du favori' };
    }

    // Supprimer le favori
    const { error: deleteError } = await supabase
      .from('library_favorites')
      .delete()
      .eq('id', favoriteId)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete library favorite', deleteError, {
        favoriteId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du favori' };
    }

    logger.info('Library favorite deleted', {
      favoriteId,
      userId: user.id,
      resourceId: existingFavorite.resource_id,
      resourceType: existingFavorite.resource_type,
    });

    return { message: 'Favori supprimé de la bibliothèque avec succès' };
  }, '/api/library/favorites', 'DELETE');
}
