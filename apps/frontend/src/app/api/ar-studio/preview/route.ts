/**
 * ★★★ API ROUTE - AR PREVIEW ★★★
 * Route API Next.js pour le preview AR
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/ar-studio/preview?modelId=xxx
 * Récupère l'URL de preview AR pour un modèle
 * Forward vers backend NestJS: GET /api/ar-studio/models/:id/preview
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      throw { status: 400, message: 'Le paramètre modelId est requis', code: 'VALIDATION_ERROR' };
    }

    const result = await forwardGet(`/ar-studio/models/${modelId}/preview`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/preview', 'GET');
}


