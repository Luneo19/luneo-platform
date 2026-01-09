import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { createCollectionSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/collections
 * Récupère toutes les collections de l'utilisateur
 * Forward vers backend NestJS: GET /collections
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const includePublic = searchParams.get('includePublic');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);
    if (includePublic) queryParams.set('includePublic', includePublic);

    const queryString = queryParams.toString();
    const url = `/collections${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/collections', 'GET');
}

/**
 * POST /api/collections
 * Créer une nouvelle collection
 * Forward vers backend NestJS: POST /collections
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createCollectionSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPost('/collections', request, validation.data);
    return result.data;
  }, '/api/collections', 'POST');
}
