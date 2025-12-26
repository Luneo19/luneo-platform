import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, getSortParams, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createDesignSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getApiRateLimit, getClientIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/designs
 * Liste les designs avec filtres avancés
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id);
    const { success, remaining, reset } = await checkRateLimit(identifier, getApiRateLimit());
    
    if (!success) {
      throw {
        status: 429,
        message: `Trop de requêtes. Réessayez après ${reset.toLocaleTimeString()}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        reset: reset.toISOString(),
      };
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const { page, limit, offset } = getPaginationParams(searchParams);
    
    // Tri
    const sortBy = searchParams.get('sort_by') || searchParams.get('sort') || 'created_at';
    const sortOrder = (searchParams.get('sort_order') || searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Filtres
    const status = searchParams.get('status'); // 'pending', 'completed', 'failed'
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Construire la requête - sélectionner uniquement les colonnes nécessaires
    let query = supabase
      .from('designs')
      .select('id, prompt, name, preview_url, original_url, status, tags, created_at, updated_at', { count: 'exact' })
      .eq('user_id', user.id);

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      query = query.ilike('prompt', `%${search.trim()}%`);
    }

    if (tags && tags.length > 0) {
      // Recherche par tags (array contains)
      query = query.contains('tags', tags);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: designs, error: dbError, count } = await query;

    if (dbError) {
      logger.dbError('fetch designs', dbError, {
        userId: user.id,
        filters: { status, search, tags, dateFrom, dateTo },
      });
      throw { status: 500, message: 'Erreur lors de la récupération des designs' };
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    const result = {
      designs: designs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  }, '/api/designs', 'GET');
}

/**
 * POST /api/designs
 * Créer un nouveau design (appelé par AI Studio)
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting (stricter for mutations)
    const identifier = getClientIdentifier(request, user.id);
    const { success, remaining, reset } = await checkRateLimit(identifier, getApiRateLimit());
    
    if (!success) {
      throw {
        status: 429,
        message: `Trop de requêtes. Réessayez après ${reset.toLocaleTimeString()}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        reset: reset.toISOString(),
      };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createDesignSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      prompt: string;
      preview_url: string;
      original_url?: string;
      style?: string;
      width?: number;
      height?: number;
      format?: 'png' | 'jpg' | 'webp';
      tags?: string[];
      metadata?: Record<string, any>;
    };
    const {
      prompt,
      style,
      preview_url,
      original_url,
      metadata = {},
      tags = [],
    } = validatedData;

    // Créer le design
    const { data: design, error: dbError } = await supabase
      .from('designs')
      .insert({
        user_id: user.id,
        prompt: prompt.trim(),
        style,
        preview_url,
        original_url,
        status: 'completed',
        tags: Array.isArray(tags) ? tags : [],
        metadata: typeof metadata === 'object' ? metadata : {},
      })
      .select()
      .single();

    if (dbError) {
      logger.dbError('create design', dbError, {
        userId: user.id,
        prompt: prompt.substring(0, 50),
      });
      throw { status: 500, message: 'Erreur lors de la création du design' };
    }

    logger.info('Design created', {
      designId: design.id,
      userId: user.id,
    });

    return { design };
  }, '/api/designs', 'POST');
}
