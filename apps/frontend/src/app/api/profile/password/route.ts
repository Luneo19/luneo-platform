import { getUserFromRequest } from '@/lib/auth/get-user';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { changePasswordSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * PUT /api/profile/password
 * Change le mot de passe de l'utilisateur
 * Forwards to backend API
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    if (!user) {
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

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour du mot de passe' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la mise à jour du mot de passe',
        code: response.status === 401 ? 'INVALID_PASSWORD' : 'PASSWORD_UPDATE_ERROR',
      };
    }

    serverLogger.info('Password changed', {
      userId: user.id,
    });

    return {
      message: 'Mot de passe modifié avec succès',
    };
  }, '/api/profile/password', 'PUT');
}
