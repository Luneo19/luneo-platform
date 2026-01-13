import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { createProductSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/products
 * Récupère la liste des produits de l'utilisateur
 * Forward vers backend NestJS: GET /api/products
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const result = await forwardGet('/products', request, {
      page,
      limit,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/products', 'GET');
}

/**
 * POST /api/products
 * Créer un nouveau produit
 * Forward vers backend NestJS: POST /api/products
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createProductSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPost('/products', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/products', 'POST');
}
