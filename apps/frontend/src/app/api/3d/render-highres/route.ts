/**
 * POST /api/3d/render-highres
 * Génère un rendu 3D haute résolution
 * Forward vers backend NestJS: POST /render/3d/highres
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';
import { renderHighresSchema } from '@/lib/validation/zod-schemas';

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(renderHighresSchema, request, async (validatedData) => {
    const result = await forwardPost('/render/3d/highres', request, validatedData);
    return result.data;
  });
}
