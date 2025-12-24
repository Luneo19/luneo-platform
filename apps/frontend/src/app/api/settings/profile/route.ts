import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Créer un profil par défaut
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

        return { profile: newProfile };
      }

      logger.dbError('fetch profile', error, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du profil' };
    }

    return { profile };
  }, '/api/settings/profile', 'GET');
}

export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const { name, company, phone, website, timezone } = body;

    // Validation
    if (name !== undefined && (!name || name.trim().length === 0)) {
      throw {
        status: 400,
        message: 'Le nom ne peut pas être vide',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validation URL si fournie
    if (website && website.trim()) {
      try {
        new URL(website);
      } catch {
        throw {
          status: 400,
          message: 'Format d\'URL invalide',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    // Récupérer le profil existant pour préserver les métadonnées
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', user.id)
      .single();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        name: name?.trim() || null,
        company: company?.trim() || null,
        metadata: {
          ...(existingProfile?.metadata || {}),
          phone: phone?.trim() || null,
          website: website?.trim() || null,
          timezone: timezone || null,
          ...(body.metadata || {}),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      logger.dbError('update profile', error, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la mise à jour du profil' };
    }

    logger.info('Profile updated via settings', { userId: user.id });

    return {
      profile,
      message: 'Profil mis à jour avec succès',
    };
  }, '/api/settings/profile', 'PUT');
}
