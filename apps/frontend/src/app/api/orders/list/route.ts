import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/orders/list
 * Récupère la liste des commandes avec pagination, tri et filtres
 * Forward vers backend NestJS: GET /api/orders (avec query params)
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    // Filtres optionnels
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const result = await forwardGet('/orders', request, {
      page,
      limit,
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(search && { search }),
      sortBy,
      sortOrder,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/orders/list', 'GET');
}
