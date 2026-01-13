/**
 * ★★★ API ROUTE - ADD COMMENT TO AR PROJECT ★★★
 * Route API Next.js pour ajouter un commentaire à un projet AR
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const AddCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  modelId: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
});

/**
 * GET /api/ar-studio/collaboration/projects/[id]/comments
 * Liste les commentaires d'un projet de collaboration AR
 * Forward vers backend NestJS: GET /api/ar-studio/collaboration/projects/:id/comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet(`/ar-studio/collaboration/projects/${params.id}/comments`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]/comments', 'GET');
}

/**
 * POST /api/ar-studio/collaboration/projects/[id]/comments
 * Ajoute un commentaire à un projet de collaboration AR
 * Body: { content, modelId?, position? }
 * Forward vers backend NestJS: POST /api/ar-studio/collaboration/projects/:id/comments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = AddCommentSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost(`/ar-studio/collaboration/projects/${params.id}/comments`, request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]/comments', 'POST');
}

