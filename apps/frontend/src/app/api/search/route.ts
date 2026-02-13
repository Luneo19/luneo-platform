import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/search?q=...&types=products,designs,orders
 * Proxies to backend GET /api/v1/search (global search across products, designs, orders).
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const types = searchParams.get('types') ?? undefined;
    const result = await forwardGet<{ results: unknown; total: number }>(
      '/v1/search',
      request,
      { q, ...(types ? { types } : {}) },
    );
    if (!result.success || result.data === undefined) {
      return { results: { products: [], designs: [], orders: [] }, total: 0 };
    }
    return result.data;
  }, '/api/search', 'GET');
}
