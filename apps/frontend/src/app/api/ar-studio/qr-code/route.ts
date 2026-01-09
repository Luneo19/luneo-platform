/**
 * ★★★ API ROUTE - AR QR CODE ★★★
 * Route API Next.js pour la génération de QR code AR
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';

/**
 * POST /api/ar-studio/qr-code
 * Génère un QR code pour partager un modèle AR
 * Body: { modelId: string }
 * Forward vers backend NestJS: POST /api/ar-studio/models/:id/qr-code
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const modelId = body.modelId;

    if (!modelId) {
      throw { status: 400, message: 'Le paramètre modelId est requis', code: 'VALIDATION_ERROR' };
    }

    const result = await forwardPost(`/ar-studio/models/${modelId}/qr-code`, request, {});
    return result.data;
  }, '/api/ar-studio/qr-code', 'POST');
}


