/**
 * ★★★ API ROUTE - AR COLLABORATION PROJECTS ★★★
 * Route API Next.js pour la gestion des projets de collaboration AR
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  modelIds: z.array(z.string()),
});

/**
 * GET /api/ar-studio/collaboration/projects
 * Liste tous les projets de collaboration AR
 * Forward vers backend NestJS: GET /api/ar-studio/collaboration/projects
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/ar-studio/collaboration/projects', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects', 'GET');
}

/**
 * POST /api/ar-studio/collaboration/projects
 * Crée un nouveau projet de collaboration AR
 * Body: { name, description?, modelIds }
 * Forward vers backend NestJS: POST /api/ar-studio/collaboration/projects
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = CreateProjectSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost('/ar-studio/collaboration/projects', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects', 'POST');
}

