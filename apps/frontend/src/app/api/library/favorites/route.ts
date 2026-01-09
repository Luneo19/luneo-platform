import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet, forwardPost, forwardDelete } from '@/lib/backend-forward';
import { addLibraryFavoriteSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/library/favorites
 * Récupère les favoris de la bibliothèque avec pagination
 * Forward vers backend NestJS: GET /library/favorites
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const resourceType = searchParams.get('type');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());
    if (resourceType) queryParams.set('type', resourceType);

    const queryString = queryParams.toString();
    const url = `/library/favorites${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/library/favorites', 'GET');
}

/**
 * POST /api/library/favorites
 * Ajoute un favori à la bibliothèque
 * Forward vers backend NestJS: POST /library/favorites
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation Zod
    const validation = addLibraryFavoriteSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const result = await forwardPost('/library/favorites', request, validation.data);
    return result.data;
  }, '/api/library/favorites', 'POST');
}

/**
 * DELETE /api/library/favorites?id=xxx
 * Supprime un favori de la bibliothèque
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
    return result.data;
  }, '/api/library/favorites', 'DELETE');
}
