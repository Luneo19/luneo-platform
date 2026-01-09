import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

type DesignRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/designs/[id]
 * Récupère un design par son ID
 * Forward vers backend NestJS: GET /api/designs/:id
 */
export async function GET(request: NextRequest, { params }: DesignRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/designs/${id}`, request);
    return result.data;
  }, '/api/designs/[id]', 'GET');
}

/**
 * PUT /api/designs/[id]
 * Met à jour un design
 * Forward vers backend NestJS: PUT /designs/:id
 */
export async function PUT(request: NextRequest, { params }: DesignRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const result = await forwardPut(`/designs/${id}`, request, body);
    return result.data;
  }, '/api/designs/[id]', 'PUT');
}

/**
 * DELETE /api/designs/[id]
 * Supprime un design
 * Forward vers backend NestJS: DELETE /designs/:id
 */
export async function DELETE(request: NextRequest, { params }: DesignRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/designs/${id}`, request);
    return result.data;
  }, '/api/designs/[id]', 'DELETE');
}

