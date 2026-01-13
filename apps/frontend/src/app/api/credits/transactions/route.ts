import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/credits/transactions
 * Récupère l'historique des transactions de crédits
 * Forward vers backend NestJS: GET /api/credits/transactions
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    const result = await forwardGet('/credits/transactions', request, {
      limit,
      offset,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/credits/transactions', 'GET');
}














