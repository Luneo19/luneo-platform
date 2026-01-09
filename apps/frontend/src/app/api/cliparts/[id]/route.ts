import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';

type ClipartRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/cliparts/[id]
 * Récupère un clipart par ID
 * Forward vers backend NestJS: GET /cliparts/:id
 */
export async function GET(request: NextRequest, { params }: ClipartRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/cliparts/${id}`, request);
    return result.data;
  }, '/api/cliparts/[id]', 'GET');
}

/**
 * PATCH /api/cliparts/[id]
 * Met à jour un clipart
 * Forward vers backend NestJS: PUT /cliparts/:id
 */
export async function PATCH(request: NextRequest, { params }: ClipartRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const result = await forwardPut(`/cliparts/${id}`, request, body);
    return result.data;
  }, '/api/cliparts/[id]', 'PATCH');
}

/**
 * DELETE /api/cliparts/[id]
 * Supprime un clipart
 * Forward vers backend NestJS: DELETE /cliparts/:id
 */
export async function DELETE(request: NextRequest, { params }: ClipartRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/cliparts/${id}`, request);
    return result.data;
  }, '/api/cliparts/[id]', 'DELETE');
}
