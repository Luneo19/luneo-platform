import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost, forwardGet, forwardDelete } from '@/lib/backend-forward';
import { inviteTeamMemberSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/team/invite
 * Invite un nouveau membre à l'équipe
 * Forward vers backend NestJS: POST /team/invite
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation Zod
    const validation = inviteTeamMemberSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const result = await forwardPost('/team/invite', request, validation.data);
    return result.data;
  }, '/api/team/invite', 'POST');
}

/**
 * GET /api/team/invite
 * Récupère toutes les invitations en attente
 * Forward vers backend NestJS: GET /team/invite
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/team/invite', _request);
    return result.data;
  }, '/api/team/invite', 'GET');
}

/**
 * DELETE /api/team/invite
 * Annule une invitation
 * Forward vers backend NestJS: DELETE /team/invite/:id
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      throw {
        status: 400,
        message: 'Paramètre id manquant',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardDelete(`/team/invite/${inviteId}`, request);
    return result.data;
  }, '/api/team/invite', 'DELETE');
}
