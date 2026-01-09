import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

export const runtime = 'nodejs';

/**
 * GET /api/referral/stats
 * Récupère les statistiques de parrainage de l'utilisateur
 * Forward vers backend NestJS: GET /referral/stats
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/referral/stats', request);
    return result.data;
  }, '/api/referral/stats', 'GET');
}

