import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { forwardPost, forwardDelete } from '@/lib/backend-forward';
import { idSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

type CollectionItemsRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/collections/[id]/items
 * Ajoute un design à une collection
 * Forward vers backend NestJS: POST /collections/:id/items
 */
export async function POST(request: NextRequest, { params }: CollectionItemsRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: collectionId } = await params;
    const body = await request.json();

    // Validation avec Zod
    const addItemSchema = z.object({
      design_id: idSchema,
      notes: z.string().max(500).optional(),
    });
    
    const validation = validateWithZodSchema(addItemSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPost(`/collections/${collectionId}/items`, request, {
      designId: validation.data.design_id,
      notes: validation.data.notes,
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/collections/[id]/items', 'POST');
}

/**
 * DELETE /api/collections/[id]/items
 * Retire un design d'une collection
 * Forward vers backend NestJS: DELETE /collections/:id/items?designId=xxx
 */
export async function DELETE(request: NextRequest, { params }: CollectionItemsRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('design_id') || searchParams.get('designId');

    if (!designId) {
      throw {
        status: 400,
        message: 'Paramètre design_id manquant',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardDelete(`/collections/${collectionId}/items?designId=${designId}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/collections/[id]/items', 'DELETE');
}
