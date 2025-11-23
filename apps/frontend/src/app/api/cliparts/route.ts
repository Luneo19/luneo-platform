import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, getSortParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClipartSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/cliparts
 * Récupère les cliparts avec pagination, tri et filtres
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
    const { sortBy, sortOrder } = getSortParams(searchParams, 'created_at', 'desc');

    // Filtres optionnels
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPublished = searchParams.get('is_published');

    // Construire la requête
    let query = supabase
      .from('cliparts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Appliquer les filtres
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (isPublished !== null) {
      query = query.eq('is_published', isPublished === 'true');
    }

    // Appliquer le tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: cliparts, error: clipartsError, count } = await query;

    if (clipartsError) {
      logger.dbError('fetch cliparts', clipartsError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des cliparts' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Cliparts fetched', {
      userId: user.id,
      count: cliparts?.length || 0,
      total: count || 0,
      page,
    });

    return {
      cliparts: cliparts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, '/api/cliparts', 'GET');
}

/**
 * POST /api/cliparts
 * Crée un nouveau clipart
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
    const validation = createClipartSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { name, category, image_url, svg_data, tags, is_premium = false } = validation.data;

    if (name.length > 200) {
      throw {
        status: 400,
        message: 'Le nom du clipart ne peut pas dépasser 200 caractères',
        code: 'VALIDATION_ERROR',
      };
    }

    // Créer le clipart
    const { data: createdClipart, error: createError } = await supabase
      .from('cliparts')
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: category || null,
        image_url: image_url,
        svg_data: svg_data || null,
        tags: Array.isArray(tags) ? tags : [],
        is_premium: is_premium || false,
        is_published: false, // Par défaut, non publié
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create clipart', createError, {
        userId: user.id,
        clipartName: name,
      });
      throw { status: 500, message: 'Erreur lors de la création du clipart' };
    }

    logger.info('Clipart created', {
      userId: user.id,
      clipartId: createdClipart.id,
      clipartName: name,
    });

    return {
      clipart: createdClipart,
      message: 'Clipart créé avec succès',
    };
  }, '/api/cliparts', 'POST');
}

/**
 * PUT /api/cliparts?id=xxx
 * Met à jour un clipart
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const clipartId = searchParams.get('id');

    if (!clipartId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const body = await request.json();

    // Vérifier que le clipart existe et appartient à l'utilisateur
    const { data: existingClipart, error: checkError } = await supabase
      .from('cliparts')
      .select('id, name')
      .eq('id', clipartId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingClipart) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Clipart non trouvé', code: 'CLIPART_NOT_FOUND' };
      }
      logger.dbError('fetch clipart for update', checkError, {
        clipartId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du clipart' };
    }

    // Mettre à jour le clipart
    const { data: updatedClipart, error: updateError } = await supabase
      .from('cliparts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clipartId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update clipart', updateError, {
        clipartId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du clipart' };
    }

    logger.info('Clipart updated', {
      clipartId,
      userId: user.id,
    });

    return {
      clipart: updatedClipart,
      message: 'Clipart mis à jour avec succès',
    };
  }, '/api/cliparts', 'PUT');
}
