import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { changePasswordSettingsSchema } from '@/lib/validation/zod-schemas';

/**
 * PUT /api/settings/password
 * Change le mot de passe de l'utilisateur
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(changePasswordSettingsSchema, request, async (validatedData) => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { current_password, new_password, confirm_password } = validatedData;

    // Vérifier le mot de passe actuel
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: current_password,
      });

      if (signInError) {
        logger.warn('Password change attempt with incorrect current password', {
          userId: user.id,
        });
        throw {
          status: 401,
          message: 'Mot de passe actuel incorrect',
          code: 'INVALID_CURRENT_PASSWORD',
        };
      }
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      logger.error('Error verifying current password', error, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la vérification du mot de passe' };
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      logger.dbError('update password', updateError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la mise à jour du mot de passe' };
    }

    logger.info('Password updated', { userId: user.id });

    return ApiResponseBuilder.success({}, 'Mot de passe mis à jour avec succès');
  });
}
