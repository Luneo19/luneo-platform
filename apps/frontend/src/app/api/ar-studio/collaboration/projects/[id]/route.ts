/**
 * ★★★ API ROUTE - AR COLLABORATION PROJECT BY ID ★★★
 * Route API Next.js pour la gestion d'un projet de collaboration AR spécifique
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';
import { z } from 'zod';

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  modelIds: z.array(z.string()).optional(),
});

/**
 * GET /api/ar-studio/collaboration/projects/[id]
 * Récupère un projet de collaboration AR par ID
 * Forward vers backend NestJS: GET /api/ar-studio/collaboration/projects/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet(`/ar-studio/collaboration/projects/${params.id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]', 'GET');
}

/**
 * PUT /api/ar-studio/collaboration/projects/[id]
 * Met à jour un projet de collaboration AR
 * Body: { name?, description?, modelIds? }
 * Forward vers backend NestJS: PUT /api/ar-studio/collaboration/projects/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = UpdateProjectSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPut(`/ar-studio/collaboration/projects/${params.id}`, request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]', 'PUT');
}

/**
 * DELETE /api/ar-studio/collaboration/projects/[id]
 * Supprime un projet de collaboration AR
 * Forward vers backend NestJS: DELETE /api/ar-studio/collaboration/projects/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardDelete(`/ar-studio/collaboration/projects/${params.id}`, request);
    return { success: true };
  }, '/api/ar-studio/collaboration/projects/[id]', 'DELETE');
}

