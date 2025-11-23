import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, getSortParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/library/templates
 * Récupère les templates de la bibliothèque avec pagination et tri
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

    // Construire la requête
    let query = supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    // Appliquer les filtres
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    // Appliquer le tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: templates, error: templatesError, count } = await query;

    if (templatesError) {
      logger.dbError('fetch library templates', templatesError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des templates' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Library templates fetched', {
      userId: user.id,
      count: templates?.length || 0,
      total: count || 0,
      page,
    });

    return {
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
  }, '/api/library/templates', 'GET');
}
