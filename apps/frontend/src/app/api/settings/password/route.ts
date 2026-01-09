import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPatch } from '@/lib/backend-forward';
import { changePasswordSettingsSchema } from '@/lib/validation/zod-schemas';

/**
 * PUT /api/settings/password
 * Change le mot de passe de l'utilisateur
 * Forward vers backend NestJS: PUT /users/me/password
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(changePasswordSettingsSchema, request, async (validatedData) => {
    const { current_password, new_password } = validatedData;
    const result = await forwardPut('/users/me/password', request, {
      current_password,
      new_password,
    });
    return result.data;
  });
}
