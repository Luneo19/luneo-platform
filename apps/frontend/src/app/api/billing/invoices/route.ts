import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/billing/invoices
 * Récupère les factures de l'utilisateur avec pagination
 * Query params: page, limit
 * Forward vers backend NestJS: GET /api/billing/invoices
 * Note: Le backend doit gérer la récupération depuis Stripe
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const result = await forwardGet('/billing/invoices', request, {
      page,
      limit,
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/billing/invoices', 'GET');
}
