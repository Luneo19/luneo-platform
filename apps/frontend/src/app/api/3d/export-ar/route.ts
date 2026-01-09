/**
 * POST /api/3d/export-ar
 * Exporte un modèle 3D pour AR (iOS/Android/Web)
 * Forward vers backend NestJS: POST /render/3d/export-ar
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';
import { exportARConfigurationSchema } from '@/lib/validation/zod-schemas';

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(exportARConfigurationSchema, request, async (validatedData) => {
    const result = await forwardPost('/render/3d/export-ar', request, validatedData);
    return result.data;
  });
}
