import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/brand-settings
 * Récupère les paramètres de marque de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer les paramètres de marque
    const { data: brandSettings, error: brandSettingsError } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (brandSettingsError) {
      if (brandSettingsError.code === 'PGRST116') {
        // Pas de paramètres de marque, retourner des valeurs par défaut
        return {
          brandSettings: {
            primary_color: '#000000',
            secondary_color: '#ffffff',
            logo_url: null,
            favicon_url: null,
            brand_name: null,
            brand_domain: null,
          },
          message: 'Paramètres de marque par défaut',
        };
      }
      logger.dbError('fetch brand settings', brandSettingsError, {
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des paramètres de marque' };
    }

    logger.info('Brand settings fetched', {
      userId: user.id,
    });

    return {
      brandSettings: brandSettings || null,
    };
  }, '/api/brand-settings', 'GET');
}

/**
 * PUT /api/brand-settings
 * Met à jour les paramètres de marque de l'utilisateur
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const {
      primary_color,
      secondary_color,
      logo_url,
      favicon_url,
      brand_name,
      brand_domain,
    } = body;

    // Validation des couleurs si fournies
    if (primary_color && !/^#[0-9A-F]{6}$/i.test(primary_color)) {
      throw {
        status: 400,
        message: 'Format de couleur primaire invalide (format hexadécimal requis: #RRGGBB)',
        code: 'VALIDATION_ERROR',
      };
    }

    if (secondary_color && !/^#[0-9A-F]{6}$/i.test(secondary_color)) {
      throw {
        status: 400,
        message: 'Format de couleur secondaire invalide (format hexadécimal requis: #RRGGBB)',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validation du domaine si fourni
    if (brand_domain) {
      try {
        new URL(`https://${brand_domain}`);
      } catch {
        throw {
          status: 400,
          message: 'Format de domaine invalide',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Vérifier si les paramètres existent déjà
    const { data: existingSettings, error: checkError } = await supabase
      .from('brand_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let updatedSettings;

    if (checkError && checkError.code === 'PGRST116') {
      // Créer les paramètres
      const { data: createdSettings, error: createError } = await supabase
        .from('brand_settings')
        .insert({
          user_id: user.id,
          primary_color: primary_color || '#000000',
          secondary_color: secondary_color || '#ffffff',
          logo_url: logo_url || null,
          favicon_url: favicon_url || null,
          brand_name: brand_name || null,
          brand_domain: brand_domain || null,
        })
        .select()
        .single();

      if (createError) {
        logger.dbError('create brand settings', createError, {
          userId: user.id,
        });
        throw { status: 500, message: 'Erreur lors de la création des paramètres de marque' };
      }

      updatedSettings = createdSettings;
    } else {
      // Mettre à jour les paramètres
      const { data: updated, error: updateError } = await supabase
        .from('brand_settings')
        .update({
          primary_color: primary_color || undefined,
          secondary_color: secondary_color || undefined,
          logo_url: logo_url !== undefined ? logo_url : undefined,
          favicon_url: favicon_url !== undefined ? favicon_url : undefined,
          brand_name: brand_name || undefined,
          brand_domain: brand_domain || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        logger.dbError('update brand settings', updateError, {
          userId: user.id,
        });
        throw { status: 500, message: 'Erreur lors de la mise à jour des paramètres de marque' };
      }

      updatedSettings = updated;
    }

    logger.info('Brand settings updated', {
      userId: user.id,
      hasLogo: !!logo_url,
      hasFavicon: !!favicon_url,
    });

    return {
      brandSettings: updatedSettings,
      message: 'Paramètres de marque mis à jour avec succès',
    };
  }, '/api/brand-settings', 'PUT');
}
