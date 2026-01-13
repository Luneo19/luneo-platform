import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/monitoring/dashboard
 * Récupère les données du dashboard de monitoring
 * Forward vers backend NestJS: GET /observability/costs
 * Note: Nécessite le rôle PLATFORM_ADMIN
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const queryParams = new URLSearchParams();
    queryParams.set('period', period);
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    const queryString = queryParams.toString();
    const url = `/observability/costs${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/monitoring/dashboard', 'GET');
}

