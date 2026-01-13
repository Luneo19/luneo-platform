import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardDelete } from '@/lib/backend-forward';

export const runtime = 'nodejs';

/**
 * GET /api/notifications/[id]
 * Récupère une notification spécifique
 * Forward vers backend NestJS: GET /notifications/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/notifications/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/notifications/[id]', 'GET');
}

/**
 * DELETE /api/notifications/[id]
 * Supprime une notification
 * Forward vers backend NestJS: DELETE /notifications/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/notifications/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/notifications/[id]', 'DELETE');
}
