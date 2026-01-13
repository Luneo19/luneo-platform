/**
 * ★★★ API ROUTE - ADD MEMBER TO AR PROJECT ★★★
 * Route API Next.js pour ajouter un membre à un projet AR
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost, forwardDelete } from '@/lib/backend-forward';
import { z } from 'zod';

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['editor', 'viewer']),
});

/**
 * GET /api/ar-studio/collaboration/projects/[id]/members
 * Liste les membres d'un projet de collaboration AR
 * Forward vers backend NestJS: GET /api/ar-studio/collaboration/projects/:id/members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet(`/ar-studio/collaboration/projects/${params.id}/members`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]/members', 'GET');
}

/**
 * POST /api/ar-studio/collaboration/projects/[id]/members
 * Ajoute un membre à un projet de collaboration AR
 * Body: { userId, role }
 * Forward vers backend NestJS: POST /api/ar-studio/collaboration/projects/:id/members
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = AddMemberSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost(`/ar-studio/collaboration/projects/${params.id}/members`, request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]/members', 'POST');
}

/**
 * DELETE /api/ar-studio/collaboration/projects/[id]/members?userId=xxx
 * Supprime un membre d'un projet de collaboration AR
 * Forward vers backend NestJS: DELETE /api/ar-studio/collaboration/projects/:id/members?userId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      throw { status: 400, message: 'Le paramètre userId est requis', code: 'VALIDATION_ERROR' };
    }

    const result = await forwardDelete(`/ar-studio/collaboration/projects/${params.id}/members`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/collaboration/projects/[id]/members', 'DELETE');
}

