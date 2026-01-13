/**
 * Marketplace Templates API
 * MK-001 à MK-005: API pour les templates du marketplace
 * Forward vers backend NestJS: GET /ai-studio/templates
 * Note: Utilise les templates AI Studio comme marketplace templates
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/marketplace/templates
 * Récupère les templates du marketplace
 * Forward vers backend NestJS: GET /ai-studio/templates
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const category = searchParams.get('category');
    const search = searchParams.get('query') || searchParams.get('search');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());
    if (category) queryParams.set('category', category);
    if (search) queryParams.set('search', search);

    const queryString = queryParams.toString();
    const url = `/ai-studio/templates${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/marketplace/templates', 'GET');
}


