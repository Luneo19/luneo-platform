import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost, forwardGet } from '@/lib/backend-forward';
import { convert2DTo3DSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/ar/convert-2d-to-3d
 * Convertir une image 2D en modèle 3D via Meshy.ai
 * Forward vers backend NestJS: POST /ar-studio/convert-2d-to-3d
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(convert2DTo3DSchema, request, async (validatedData) => {
    const { design_id, image_url } = validatedData as { design_id: string; image_url: string };
    const result = await forwardPost('/ar-studio/convert-2d-to-3d', request, {
      design_id,
      image_url,
    });
    return result.data;
  });
}

/**
 * GET /api/ar/convert-2d-to-3d?task_id=xxx
 * Vérifier le statut d'une conversion en cours
 * Forward vers backend NestJS: GET /ar-studio/convert-2d-to-3d?task_id=xxx
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      throw {
        status: 400,
        message: 'Le paramètre task_id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardGet('/ar-studio/convert-2d-to-3d', request, {
      task_id: taskId,
    });
    return result.data;
  }, '/api/ar/convert-2d-to-3d', 'GET');
}
