/**
 * ★★★ API ROUTE - CONTEXT FILES CONTENT ★★★
 * API route pour récupérer le contenu textuel des fichiers contextuels
 * Permet à l'agent/chat d'accéder au contenu des fichiers pour le contexte
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * GET - Récupère le contenu textuel d'un fichier contextuel
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      throw {
        status: 401,
        message: 'Non authentifié',
        code: 'UNAUTHORIZED',
      };
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const fileUrl = searchParams.get('url');

    if (!fileId && !fileUrl) {
      throw {
        status: 400,
        message: 'Le paramètre id ou url est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Migrated: content is fetched via backend API; this route forwards the request.
    const url = new URL(`${API_URL}/api/v1/chat/other-files-context/content`);
    if (fileId) url.searchParams.set('id', fileId);
    if (fileUrl) url.searchParams.set('url', fileUrl);

    const backendResponse = await fetch(url.toString(), {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw {
          status: 404,
          message: 'Fichier contextuel non trouvé',
          code: 'FILE_NOT_FOUND',
        };
      }
      logger.error('Failed to fetch context file content', {
        userId: user.id,
        fileId,
        fileUrl,
        status: backendResponse.status,
      });
      throw {
        status: 500,
        message: 'Erreur lors du traitement du fichier',
        code: 'PROCESSING_ERROR',
      };
    }

    const result = await backendResponse.json();
    logger.info('Context file content retrieved', {
      userId: user.id,
      fileId,
      fileUrl,
      contentType: result.contentType,
      contentLength: result.content?.length,
    });

    return result;
  }, '/api/chat/other-files-context/content', 'GET');
}
