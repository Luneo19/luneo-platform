import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';

type TeamMemberRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/team/[id]
 * Récupère un membre d'équipe spécifique
 * Forward vers backend NestJS: GET /team/:id
 */
export async function GET(request: NextRequest, { params }: TeamMemberRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/team/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/team/[id]', 'GET');
}

/**
 * PUT /api/team/[id]
 * Met à jour un membre d'équipe (rôle, permissions)
 * Forward vers backend NestJS: PUT /team/:id
 */
export async function PUT(request: NextRequest, { params }: TeamMemberRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const result = await forwardPut(`/team/${id}`, request, body);
    return ApiResponseBuilder.success(result.data);
  }, '/api/team/[id]', 'PUT');
}

/**
 * DELETE /api/team/[id]
 * Supprime un membre d'équipe
 * Forward vers backend NestJS: DELETE /team/:id
 */
export async function DELETE(request: NextRequest, { params }: TeamMemberRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/team/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/team/[id]', 'DELETE');
}
