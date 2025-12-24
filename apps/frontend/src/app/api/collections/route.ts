import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createCollectionSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/collections
 * Récupère toutes les collections de l'utilisateur
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('public') === 'true';

    let query = supabase
      .from('design_collections')
      .select('id, name, description, color, is_public, tags, views_count, designs_count, created_at, updated_at, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (includePublic) {
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      logger.dbError('fetch collections', error, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des collections' };
    }

    const response = NextResponse.json({ collections: data || [] });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  }, '/api/collections', 'GET');
}

/**
 * POST /api/collections
 * Créer une nouvelle collection
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createCollectionSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      name: string;
      description?: string;
      color?: string;
      is_public?: boolean;
      tags?: string[];
    };
    const { name, description, color, is_public, tags } = validatedData;

    const { data, error } = await supabase
      .from('design_collections')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        color: color || '#6366f1',
        is_public: is_public || false,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      logger.dbError('create collection', error, { userId: user.id, name });
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw {
          status: 409,
          message: 'Une collection avec ce nom existe déjà',
          code: 'DUPLICATE_COLLECTION',
        };
      }

      throw { status: 500, message: 'Erreur lors de la création de la collection' };
    }

    return { collection: data };
  }, '/api/collections', 'POST');
}
