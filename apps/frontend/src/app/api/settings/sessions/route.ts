import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardDelete } from '@/lib/backend-forward';

/**
 * GET /api/settings/sessions
 * Récupère toutes les sessions actives de l'utilisateur
 * Forward vers backend NestJS: GET /users/me/sessions
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/users/me/sessions', _request);
    return result.data;
  }, '/api/settings/sessions', 'GET');
}

/**
 * DELETE /api/settings/sessions
 * Supprime une session spécifique ou toutes les sessions sauf la actuelle
 * Forward vers backend NestJS: DELETE /users/me/sessions/:id ou DELETE /users/me/sessions?all=true
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      const result = await forwardDelete('/users/me/sessions?all=true', request);
      return result.data;
    }

    if (sessionId) {
      const result = await forwardDelete(`/users/me/sessions/${sessionId}`, request);
      return result.data;
    }

    throw {
      status: 400,
      message: 'Paramètre session_id ou all requis',
      code: 'VALIDATION_ERROR',
    };
  }, '/api/settings/sessions', 'DELETE');
}
