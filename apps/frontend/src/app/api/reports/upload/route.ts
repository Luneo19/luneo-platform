/**
 * ★★★ API ROUTE - UPLOAD RAPPORTS ★★★
 * API route pour uploader les rapports générés vers le stockage
 * - Support S3/Cloudinary
 * - Validation des fichiers
 * - Retourne l'URL publique
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ApiResponseBuilder.badRequest('Aucun fichier fourni');
    }

    // Vérifier le type de fichier (JSON, CSV, PDF uniquement)
    const allowedTypes = ['application/json', 'text/csv', 'application/pdf'];
    const fileType = file.type;
    
    if (!allowedTypes.includes(fileType)) {
      return ApiResponseBuilder.badRequest(
        `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      );
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return ApiResponseBuilder.badRequest('Fichier trop volumineux (max 10MB)');
    }

    logger.info('Upload rapport', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType,
      userId: user.id,
    });

    // Forward to backend API
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const backendResponse = await fetch(`${API_URL}/api/v1/reports/upload`, {
      method: 'POST',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
      body: uploadFormData,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Error uploading report', {
        error: errorText,
        userId: user.id,
        fileName: file.name,
        status: backendResponse.status,
      });
      return ApiResponseBuilder.internalError('Erreur lors de l\'upload du rapport');
    }

    const result = await backendResponse.json();
    logger.info('Rapport uploadé avec succès', {
      fileName: result.fileName,
      userId: user.id,
      url: result.url,
    });

    return result;
  }, '/api/reports/upload', 'POST');
}

/**
 * DELETE - Supprime un rapport
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return ApiResponseBuilder.badRequest('URL du fichier manquante');
    }

    // Forward to backend API
    const url = new URL(`${API_URL}/api/v1/reports/upload`);
    url.searchParams.set('url', fileUrl);

    const backendResponse = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Error deleting report', {
        error: errorText,
        userId: user.id,
        fileUrl,
        status: backendResponse.status,
      });
      return ApiResponseBuilder.internalError('Erreur lors de la suppression du rapport');
    }

    const result = await backendResponse.json();
    logger.info('Rapport supprimé avec succès', {
      userId: user.id,
      fileUrl,
    });

    return result;
  }, '/api/reports/upload', 'DELETE');
}

