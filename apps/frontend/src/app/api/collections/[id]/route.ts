import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';
import { updateCollectionSchema } from '@/lib/validation/zod-schemas';

type CollectionRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/collections/[id]
 * Récupère une collection avec ses designs
 * Forward vers backend NestJS: GET /collections/:id
 */
export async function GET(request: NextRequest, { params }: CollectionRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/collections/${id}`, request);
    return result.data;
  }, '/api/collections/[id]', 'GET');
}

/**
 * PUT /api/collections/[id]
 * Met à jour une collection
 * Forward vers backend NestJS: PUT /collections/:id
 */
export async function PUT(request: NextRequest, { params }: CollectionRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(updateCollectionSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPut(`/collections/${id}`, request, validation.data);
    return result.data;
  }, '/api/collections/[id]', 'PUT');
}

/**
 * DELETE /api/collections/[id]
 * Supprime une collection
 * Forward vers backend NestJS: DELETE /collections/:id
 */
export async function DELETE(request: NextRequest, { params }: CollectionRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/collections/${id}`, request);
    return result.data;
  }, '/api/collections/[id]', 'DELETE');
}
