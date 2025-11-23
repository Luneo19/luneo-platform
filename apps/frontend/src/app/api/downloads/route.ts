import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, getSortParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createDownloadSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/downloads
 * Récupère l'historique des téléchargements de l'utilisateur
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
    const { sortBy, sortOrder } = getSortParams(searchParams, 'downloaded_at', 'desc');

    // Filtres optionnels
    const resourceType = searchParams.get('type'); // 'design', 'template', 'clipart'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construire la requête
    let query = supabase
      .from('downloads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Appliquer les filtres
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (startDate) {
      query = query.gte('downloaded_at', startDate);
    }

    if (endDate) {
      query = query.lte('downloaded_at', endDate);
    }

    // Appliquer le tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: downloads, error: downloadsError, count } = await query;

    if (downloadsError) {
      logger.dbError('fetch downloads', downloadsError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des téléchargements' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Downloads fetched', {
      userId: user.id,
      count: downloads?.length || 0,
      total: count || 0,
      page,
      filters: { resourceType, startDate, endDate },
    });

    return {
      downloads: downloads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, '/api/downloads', 'GET');
}

/**
 * POST /api/downloads
 * Enregistre un téléchargement
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
    const validation = createDownloadSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { resource_id, resource_type, file_url, file_size, format } = validation.data;

    // Enregistrer le téléchargement
    const { data: createdDownload, error: createError } = await supabase
      .from('downloads')
      .insert({
        user_id: user.id,
        resource_id: resource_id,
        resource_type: resource_type,
        file_url: file_url,
        file_size: file_size || null,
        format: format || null,
        downloaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create download record', createError, {
        userId: user.id,
        resourceId: resource_id,
        resourceType: resource_type,
      });
      throw { status: 500, message: 'Erreur lors de l\'enregistrement du téléchargement' };
    }

    logger.info('Download recorded', {
      userId: user.id,
      downloadId: createdDownload.id,
      resourceId: resource_id,
      resourceType: resource_type,
      format,
    });

    return ApiResponseBuilder.success({
      download: createdDownload,
    }, 'Téléchargement enregistré avec succès', 201);
  }, '/api/downloads', 'POST');
}
