/**
 * ★★★ API ROUTE - SYNC AR INTEGRATION ★★★
 * Route API Next.js pour synchroniser une intégration AR
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';

/**
 * POST /api/ar-studio/integrations/[id]/sync
 * Synchronise une intégration AR
 * Query params: type? (manual, scheduled, real-time)
 * Forward vers backend NestJS: POST /api/ar-studio/integrations/:id/sync
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'manual';

    const result = await forwardPost(`/ar-studio/integrations/${params.id}/sync`, request, {
      type,
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/integrations/[id]/sync', 'POST');
}

