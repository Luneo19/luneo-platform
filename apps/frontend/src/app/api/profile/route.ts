import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/profile
 * Récupère le profil de l'utilisateur connecté
 */
export async function GET() {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le profil complet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profil n'existe pas, créer un profil par défaut
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
          })
          .select()
          .single();

        if (createError) {
          logger.dbError('create default profile', createError, { userId: user.id });
          throw { status: 500, message: 'Erreur lors de la création du profil' };
        }

        return {
          profile: {
            ...newProfile,
            stats: {
              designs_count: 0,
              products_count: 0,
            },
          },
        };
      }

      logger.dbError('fetch profile', profileError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du profil' };
    }

    // Récupérer les stats utilisateur (non bloquant)
    const [designsResult, productsResult] = await Promise.allSettled([
      supabase
        .from('designs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    const designsCount =
      designsResult.status === 'fulfilled' ? designsResult.value.count || 0 : 0;
    const productsCount =
      productsResult.status === 'fulfilled' ? productsResult.value.count || 0 : 0;

    if (designsResult.status === 'rejected') {
      logger.warn('Failed to fetch designs count', { userId: user.id, error: designsResult.reason });
    }
    if (productsResult.status === 'rejected') {
      logger.warn('Failed to fetch products count', { userId: user.id, error: productsResult.reason });
    }

    return {
      profile: {
        ...profile,
        stats: {
          designs_count: designsCount,
          products_count: productsCount,
        },
      },
    };
  }, '/api/profile', 'GET');
}

/**
 * PUT /api/profile
 * Met à jour le profil de l'utilisateur
 */
export async function PUT(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const {
      name,
      company,
      website,
      phone,
      timezone,
      avatar_url,
      bio,
      metadata,
    } = body;

    // Validation de l'URL du site web si fournie
    if (website && website.trim()) {
      try {
        new URL(website);
      } catch {
        throw {
          status: 400,
          message: 'Format d\'URL invalide pour le site web',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Validation du téléphone si fourni
    if (phone && phone.trim()) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        throw {
          status: 400,
          message: 'Format de téléphone invalide',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name?.trim() || null;
    if (company !== undefined) updateData.company = company?.trim() || null;
    if (website !== undefined) updateData.website = website?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (timezone !== undefined) updateData.timezone = timezone || null;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url?.trim() || null;
    if (bio !== undefined) updateData.bio = bio?.trim() || null;

    // Mettre à jour les métadonnées si fournies
    if (metadata !== undefined) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single();

      updateData.metadata = {
        ...(existingProfile?.metadata || {}),
        ...(typeof metadata === 'object' ? metadata : {}),
      };
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update profile', updateError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la mise à jour du profil' };
    }

    logger.info('Profile updated', { userId: user.id });

    return { profile: updatedProfile, message: 'Profil mis à jour avec succès' };
  }, '/api/profile', 'PUT');
}
