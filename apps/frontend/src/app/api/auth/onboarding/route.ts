import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { onboardingSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/auth/onboarding
 * Complète le processus d'onboarding d'un utilisateur
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
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { step, data } = validation.data;

    // Vérifier le profil existant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch profile for onboarding', profileError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du profil' };
    }

    // Traiter selon l'étape
    let updateData: Record<string, any> = {};
    let onboardingStatus = profile?.onboarding_status || {};

    switch (step) {
      case 'welcome':
        onboardingStatus = { ...onboardingStatus, welcome_completed: true };
        break;

      case 'profile':
        if (!data.name || !data.company) {
          throw {
            status: 400,
            message: 'Le nom et l\'entreprise sont requis',
            code: 'VALIDATION_ERROR',
          };
        }
        updateData = {
          name: data.name,
          company: data.company,
          role: data.role,
          phone: data.phone,
        };
        onboardingStatus = { ...onboardingStatus, profile_completed: true };
        break;

      case 'preferences':
        updateData = {
          preferences: data.preferences || {},
        };
        onboardingStatus = { ...onboardingStatus, preferences_completed: true };
        break;

      case 'complete':
        onboardingStatus = {
          ...onboardingStatus,
          completed: true,
          completed_at: new Date().toISOString(),
        };
        break;

      default:
        throw {
          status: 400,
          message: `Étape invalide: ${step}`,
          code: 'VALIDATION_ERROR',
        };
    }

    // Mettre à jour le profil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          ...updateData,
          onboarding_status: onboardingStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (updateError) {
      logger.dbError('update profile onboarding', updateError, {
        userId: user.id,
        step,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du profil' };
    }

    logger.info('Onboarding step completed', {
      userId: user.id,
      step,
      completed: onboardingStatus.completed || false,
    });

    return ApiResponseBuilder.success({
      profile: updatedProfile,
      onboardingStatus,
      completed: onboardingStatus.completed || false,
    });
  }, '/api/auth/onboarding', 'POST');
}

/**
 * GET /api/auth/onboarding
 * Récupère le statut d'onboarding de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_status, name, company')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch onboarding status', profileError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du statut' };
    }

    const onboardingStatus = profile?.onboarding_status || {};
    const isCompleted = onboardingStatus.completed || false;

    return ApiResponseBuilder.success({
      onboardingStatus,
      completed: isCompleted,
      currentStep: isCompleted
        ? 'complete'
        : onboardingStatus.preferences_completed
          ? 'complete'
          : onboardingStatus.profile_completed
            ? 'preferences'
            : onboardingStatus.welcome_completed
              ? 'profile'
              : 'welcome',
    });
  }, '/api/auth/onboarding', 'GET');
}
