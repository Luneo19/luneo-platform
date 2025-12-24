import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, getSortParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createTemplateSchema } from '@/lib/validation/zod-schemas';
import { cacheService, cacheKeys, cacheTTL } from '@/lib/cache/redis';

/**
 * GET /api/templates
 * Récupère les templates avec pagination, tri et filtres
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

    // Vérifier le cache
    const cacheKey = cacheKeys.templates(page, limit);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Templates served from cache', { userId: user.id, page });
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Filtres optionnels
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPublished = searchParams.get('is_published');

    // Construire la requête - sélectionner uniquement les colonnes nécessaires
    let query = supabase
      .from('templates')
      .select('id, name, description, category, preview_url, thumbnail_url, tags, is_published, is_featured, views_count, uses_count, created_at, updated_at', { count: 'exact' })
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

    const { data: templates, error: templatesError, count } = await query;

    if (templatesError) {
      logger.dbError('fetch templates', templatesError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des templates' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Templates fetched', {
      userId: user.id,
      count: templates?.length || 0,
      total: count || 0,
      page,
    });

    const result = {
      templates: templates || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // Mettre en cache (1 heure TTL)
    await cacheService.set(cacheKey, result, { ttl: cacheTTL.templates });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/templates', 'GET');
}

/**
 * POST /api/templates
 * Crée un nouveau template
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
    const validation = createTemplateSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { name, category, thumbnail_url, template_data, tags, is_premium = false } = validation.data;

    // Créer le template
    const { data: createdTemplate, error: createError } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: category || null,
        thumbnail_url: thumbnail_url || null,
        template_data: template_data,
        tags: Array.isArray(tags) ? tags : [],
        is_premium: is_premium || false,
        is_published: false, // Par défaut, non publié
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create template', createError, {
        userId: user.id,
        templateName: name,
      });
      throw { status: 500, message: 'Erreur lors de la création du template' };
    }

    logger.info('Template created', {
      userId: user.id,
      templateId: createdTemplate.id,
      templateName: name,
    });

    return ApiResponseBuilder.success({
      template: createdTemplate,
    }, 'Template créé avec succès', 201);
  }, '/api/templates', 'POST');
}

/**
 * PUT /api/templates?id=xxx
 * Met à jour un template
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const body = await request.json();

    // Vérifier que le template existe et appartient à l'utilisateur
    const { data: existingTemplate, error: checkError } = await supabase
      .from('templates')
      .select('id, name')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingTemplate) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Template non trouvé', code: 'TEMPLATE_NOT_FOUND' };
      }
      logger.dbError('fetch template for update', checkError, {
        templateId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du template' };
    }

    // Mettre à jour le template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('templates')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update template', updateError, {
        templateId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du template' };
    }

    logger.info('Template updated', {
      templateId,
      userId: user.id,
    });

    return {
      template: updatedTemplate,
      message: 'Template mis à jour avec succès',
    };
  }, '/api/templates', 'PUT');
}
