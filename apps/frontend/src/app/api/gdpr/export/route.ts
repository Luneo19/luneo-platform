import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * GET /api/gdpr/export
 * Exporte toutes les données utilisateur au format GDPR (JSON)
 * Forward to backend
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    logger.info('GDPR export requested', {
      userId: user.id,
    });

    // Forward to backend API
    const backendResponse = await fetch(`${API_URL}/api/v1/gdpr/export`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Failed to export GDPR data', {
        userId: user.id,
        status: backendResponse.status,
        error: errorText,
      });
      throw { status: 500, message: 'Erreur lors de l\'export des données GDPR' };
    }

    const result = await backendResponse.json();
    logger.info('GDPR export completed', {
      userId: user.id,
      dataSize: JSON.stringify(result.data).length,
    });

    return result;
  }, '/api/gdpr/export', 'GET');
}
