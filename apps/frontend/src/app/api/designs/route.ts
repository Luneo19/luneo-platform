import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { createDesignSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/designs
 * Liste les designs avec filtres avancés
 * Forward vers backend NestJS: GET /designs
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());
    if (status) queryParams.set('status', status);
    if (search) queryParams.set('search', search);

    const queryString = queryParams.toString();
    const url = `/designs${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/designs', 'GET');
}

/**
 * POST /api/designs
 * Créer un nouveau design (appelé par AI Studio)
 * Forward vers backend NestJS: POST /api/designs
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createDesignSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPost('/designs', request, validation.data);
    return result.data;
  }, '/api/designs', 'POST');
}
