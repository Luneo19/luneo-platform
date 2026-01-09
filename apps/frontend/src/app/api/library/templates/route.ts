import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/library/templates
 * Récupère les templates de la bibliothèque avec pagination et tri
 * Forward vers backend NestJS: GET /ai-studio/templates
 * Note: Pour la library, on utilise les templates de toutes les marques (isActive=true)
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());
    if (category) queryParams.set('category', category);
    if (search) queryParams.set('search', search);

    const queryString = queryParams.toString();
    const url = `/ai-studio/templates${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/library/templates', 'GET');
}
