import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { createApiKeySchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/api-keys
 * Récupère toutes les clés API de l'utilisateur avec pagination
 * Forward vers backend NestJS: GET /api/api-keys
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const result = await forwardGet('/api-keys', request, {
      page,
      limit,
    });

    return result.data;
  }, '/api/api-keys', 'GET');
}

/**
 * POST /api/api-keys
 * Crée une nouvelle clé API
 * Forward vers backend NestJS: POST /api/api-keys
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation Zod
    const validation = createApiKeySchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const result = await forwardPost('/api-keys', request, validation.data);
    return result.data;
  }, '/api/api-keys', 'POST');
}

/**
 * DELETE /api/api-keys?id=xxx
 * Supprime une clé API
 * Forward vers backend NestJS: DELETE /api/api-keys/:id
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const { forwardDelete } = await import('@/lib/backend-forward');
    const result = await forwardDelete(`/api-keys/${keyId}`, request);
    return result.data;
  }, '/api/api-keys', 'DELETE');
}
