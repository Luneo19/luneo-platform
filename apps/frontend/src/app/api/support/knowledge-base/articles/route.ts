import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/support/knowledge-base/articles
 * Liste les articles de la base de connaissances
 * Forward vers backend NestJS: GET /support/knowledge-base/articles
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const result = await forwardGet('/support/knowledge-base/articles', request, {
      page,
      limit,
      category,
      search,
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/support/knowledge-base/articles', 'GET');
}
