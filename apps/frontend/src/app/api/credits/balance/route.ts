import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/credits/balance
 * Récupère le solde de crédits IA de l'utilisateur
 * Forward vers backend NestJS: GET /api/credits/balance
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/credits/balance', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/credits/balance', 'GET');
}














