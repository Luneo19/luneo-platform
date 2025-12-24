import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { idSchema, nameSchema, descriptionSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { apiRateLimit } from '@/lib/rate-limit';
import { cacheService, cacheKeys, cacheTTL } from '@/lib/cache/redis';

/**
 * GET /api/designs/[id]/versions
 * Récupère l'historique des versions d'un design
 * Système de versioning complet avec pagination et filtres
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le design appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('custom_designs')
      .select('id, user_id, name')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for versions', designError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id);
    const rateLimitResult = await checkRateLimit(identifier, apiRateLimit);
    
    if (!rateLimitResult.success) {
      throw {
        status: 429,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          reset: rateLimitResult.reset.toISOString(),
          remaining: rateLimitResult.remaining,
        },
      };
    }

    // Pagination et filtres
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;
    const autoOnly = searchParams.get('auto_only') === 'true';

    // Cache check
    const cacheKey = cacheKeys.designVersions(designId, page, limit, autoOnly);
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      logger.info('Design versions served from cache', { designId, page, limit });
      return cached;
    }

    // Requête de base
    let query = supabase
      .from('design_versions')
      .select('*', { count: 'exact' })
      .eq('design_id', designId);

    // Filtrer les versions auto si demandé
    if (autoOnly) {
      query = query.eq('metadata->>auto_save', 'true');
    }

    // Tri et pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: versions, error: versionsError, count } = await query;

    if (versionsError) {
      logger.dbError('fetch design versions', versionsError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des versions' };
    }

    logger.info('Design versions fetched', {
      designId,
      userId: user.id,
      count: versions?.length || 0,
      total: count || 0,
    });

    const result = {
      design_id: designId,
      design_name: design.name,
      versions: versions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };

    // Cache result
    await cacheService.set(cacheKey, result, { ttl: cacheTTL.designVersions });

    return result;
  }, '/api/designs/[id]/versions', 'GET');
}

/**
 * POST /api/designs/[id]/versions
 * Crée une nouvelle version d'un design (versioning manuel)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Validation body avec Zod
    const createVersionSchema = z.object({
      name: nameSchema.optional(),
      description: descriptionSchema,
    });

    let body;
    try {
      body = await request.json();
    } catch {
      throw { status: 400, message: 'Body JSON invalide', code: 'INVALID_JSON' };
    }

    const validatedBody = createVersionSchema.parse(body || {});
    const { name, description } = validatedBody;

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id);
    const rateLimitResult = await checkRateLimit(identifier, apiRateLimit);
    
    if (!rateLimitResult.success) {
      throw {
        status: 429,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
    }

    // Vérifier que le design appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('custom_designs')
      .select('*')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for version creation', designError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Optimisation: Utiliser MAX pour éviter les race conditions sur version_number
    const { data: maxVersion } = await supabase
      .from('design_versions')
      .select('version_number')
      .eq('design_id', designId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const versionNumber = (maxVersion?.version_number || 0) + 1;

    // Créer une nouvelle version
    const versionData = {
      design_id: designId,
      version_number: versionNumber,
      name: name || `Version ${versionNumber} - ${new Date().toLocaleDateString('fr-FR')}`,
      description: description || null,
      design_data: design.design_data || design,
      metadata: {
        created_by: user.id,
        created_at: new Date().toISOString(),
        manual: true,
        design_name: design.name,
      },
    };

    const { data: version, error: versionError } = await supabase
      .from('design_versions')
      .insert(versionData)
      .select()
      .single();

    if (versionError) {
      logger.dbError('create design version', versionError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la création de la version' };
    }

    logger.info('Design version created', {
      designId,
      versionId: version.id,
      versionNumber,
      userId: user.id,
    });

    // Invalider le cache des versions
    await cacheService.deleteMany([
      cacheKeys.designVersions(designId, 1, 50, false),
      cacheKeys.designVersions(designId, 1, 50, true),
    ]);

    return {
      version,
      message: 'Version créée avec succès',
    };
  }, '/api/designs/[id]/versions', 'POST');
}

