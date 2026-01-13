import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/team/members
 * Récupère tous les membres de l'équipe avec pagination
 * Forward vers backend NestJS: GET /team/members
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());

    const queryString = queryParams.toString();
    const url = `/team/members${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/team/members', 'GET');
}
