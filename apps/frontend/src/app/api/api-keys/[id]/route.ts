import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';

type ApiKeyRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/api-keys/[id]
 * Récupère une clé API spécifique
 * Forward vers backend NestJS: GET /api/api-keys/:id
 */
export async function GET(request: NextRequest, { params }: ApiKeyRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/api-keys/${id}`, request);
    return result.data;
  }, '/api/api-keys/[id]', 'GET');
}

/**
 * PUT /api/api-keys/[id]
 * Met à jour une clé API (activer/désactiver, renommer)
 * Forward vers backend NestJS: PUT /api/api-keys/:id
 */
export async function PUT(request: NextRequest, { params }: ApiKeyRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();

    const result = await forwardPut(`/api-keys/${id}`, request, body);
    return result.data;
  }, '/api/api-keys/[id]', 'PUT');
}

/**
 * DELETE /api/api-keys/[id]
 * Supprime une clé API
 * Forward vers backend NestJS: DELETE /api/api-keys/:id
 */
export async function DELETE(request: NextRequest, { params }: ApiKeyRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/api-keys/${id}`, request);
    return result.data;
  }, '/api/api-keys/[id]', 'DELETE');
}
