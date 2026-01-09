import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';

export const runtime = 'nodejs';

/**
 * POST /api/notifications/[id]/read
 * Marque une notification comme lue
 * Forward vers backend NestJS: POST /notifications/:id/read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardPost(`/notifications/${id}/read`, request);
    return result.data;
  }, '/api/notifications/[id]/read', 'POST');
}

