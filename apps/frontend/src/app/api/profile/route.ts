import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPatch } from '@/lib/backend-forward';

/**
 * GET /api/profile
 * Récupère le profil de l'utilisateur connecté
 * Forward vers backend NestJS: GET /api/users/me
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/users/me', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/profile', 'GET');
}

/**
 * PUT /api/profile
 * Met à jour le profil de l'utilisateur
 * Forward vers backend NestJS: PATCH /api/users/me
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    const result = await forwardPatch('/users/me', request, body);
    return ApiResponseBuilder.success(result.data);
  }, '/api/profile', 'PUT');
}
