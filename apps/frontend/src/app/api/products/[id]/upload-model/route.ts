/**
 * POST /api/products/[id]/upload-model
 * Upload un modèle 3D pour un produit
 * Forward vers backend NestJS: POST /products/:id/upload-model
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

// ========================================
// SCHEMA
// ========================================

const UploadModelSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const productId = params.id;
    const body = await request.json();

    // Validation
    const validated = UploadModelSchema.parse(body);

    // Forward vers le backend qui gère validation, upload et mise à jour
    const result = await forwardPost(`/products/${productId}/upload-model`, request, validated);
    return result.data;
  }, '/api/products/[id]/upload-model', 'POST');
}

