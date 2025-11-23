import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { changePasswordSchema } from '@/lib/validation/zod-schemas';

/**
 * PUT /api/profile/password
 * Change le mot de passe de l'utilisateur
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(changePasswordSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      currentPassword: string;
      newPassword: string;
    };
    const { currentPassword, newPassword } = validatedData;

    // Vérifier que le mot de passe actuel est correct
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: currentPassword,
    });

    if (signInError || !signInData.user) {
      logger.warn('Password change failed - incorrect current password', {
        userId: user.id,
      });
      throw {
        status: 401,
        message: 'Mot de passe actuel incorrect',
        code: 'INVALID_PASSWORD',
      };
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      logger.error('Password update error', updateError, {
        userId: user.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la mise à jour du mot de passe',
        code: 'PASSWORD_UPDATE_ERROR',
      };
    }

    logger.info('Password changed', {
      userId: user.id,
    });

    return {
      message: 'Mot de passe modifié avec succès',
    };
  }, '/api/profile/password', 'PUT');
}
