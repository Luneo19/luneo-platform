import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { inviteTeamMemberSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/team
 * Récupère tous les membres de l'équipe
 * Forward vers backend NestJS: GET /team
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/team', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/team', 'GET');
}

/**
 * POST /api/team
 * Inviter un nouveau membre
 * Forward vers backend NestJS: POST /team/invite
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(inviteTeamMemberSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const result = await forwardPost('/team/invite', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/team', 'POST');
}
