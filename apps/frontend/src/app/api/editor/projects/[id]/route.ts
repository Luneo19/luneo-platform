import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';

type EditorProjectRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/editor/projects/[id]
 * Récupère un projet d'édition spécifique
 * Forward vers backend NestJS: GET /api/editor/projects/:id
 */
export async function GET(
  request: NextRequest,
  { params }: EditorProjectRouteContext,
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/editor/projects/${id}`, request);
    return result.data;
  }, '/api/editor/projects/[id]', 'GET');
}

/**
 * PUT /api/editor/projects/[id]
 * Met à jour un projet d'édition
 * Forward vers backend NestJS: PUT /api/editor/projects/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: EditorProjectRouteContext,
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const result = await forwardPut(`/editor/projects/${id}`, request, body);
    return result.data;
  }, '/api/editor/projects/[id]', 'PUT');
}

/**
 * DELETE /api/editor/projects/[id]
 * Supprime un projet d'édition
 * Forward vers backend NestJS: DELETE /api/editor/projects/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: EditorProjectRouteContext,
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/editor/projects/${id}`, request);
    return result.data || { success: true };
  }, '/api/editor/projects/[id]', 'DELETE');
}



