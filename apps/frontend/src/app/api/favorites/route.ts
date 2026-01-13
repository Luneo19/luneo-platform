import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost, forwardDelete } from '@/lib/backend-forward';
import { addFavoriteSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/favorites
 * Récupère les favoris de l'utilisateur avec pagination
 * Forward vers backend NestJS: GET /library/favorites
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const type = searchParams.get('type');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());
    if (type) queryParams.set('type', type);

    const queryString = queryParams.toString();
    const url = `/library/favorites${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/favorites', 'GET');
}

/**
 * POST /api/favorites
 * Ajoute un favori
 * Forward vers backend NestJS: POST /library/favorites
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(addFavoriteSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPost('/library/favorites', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/favorites', 'POST');
}

/**
 * DELETE /api/favorites?id=xxx
 * Supprime un favori
 * Forward vers backend NestJS: DELETE /library/favorites/:id
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('id');

    if (!favoriteId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardDelete(`/library/favorites/${favoriteId}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/favorites', 'DELETE');
}
