import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { deleteAccountSchema } from '@/lib/validation/zod-schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/gdpr/delete-account
 * Supprime définitivement le compte utilisateur et toutes ses données (RGPD Article 17).
 * Cookie-based auth, proxies to NestJS (password verification + deletion).
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(deleteAccountSchema, request, async (validatedData) => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { confirmation, password } = validatedData;

    const res = await fetch(`${API_URL}/api/v1/security/gdpr/delete-account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, reason: confirmation || 'User requested account deletion' }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = (errBody as { message?: string }).message || 'Erreur lors de la suppression du compte';
      if (res.status === 401) {
        throw { status: 401, message: 'Mot de passe incorrect', code: 'INVALID_PASSWORD' };
      }
      logger.warn('Account deletion failed', { status: res.status, errBody });
      throw { status: res.status, message, code: 'ACCOUNT_DELETION_ERROR' };
    }

    logger.warn('Account deleted successfully (via backend)');
    return ApiResponseBuilder.success({
      message: 'Compte supprimé définitivement avec succès',
    });
  });
}
