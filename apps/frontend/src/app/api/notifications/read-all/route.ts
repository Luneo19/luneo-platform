import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';

export const runtime = 'nodejs';

/**
 * POST /api/notifications/read-all
 * Marque toutes les notifications comme lues
 * Forward vers backend NestJS: POST /notifications/read-all
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardPost('/notifications/read-all', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/notifications/read-all', 'POST');
}

