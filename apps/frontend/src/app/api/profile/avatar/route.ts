import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost, forwardDelete } from '@/lib/backend-forward';

/**
 * POST /api/profile/avatar
 * Upload et mise à jour de l'avatar utilisateur
 * Forward vers backend NestJS: POST /users/me/avatar
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      throw {
        status: 400,
        message: 'Aucun fichier fourni',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!file.type.startsWith('image/')) {
      throw {
        status: 400,
        message: 'Le fichier doit être une image',
        code: 'VALIDATION_ERROR',
      };
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw {
        status: 400,
        message: 'L\'image ne doit pas dépasser 2MB',
        code: 'VALIDATION_ERROR',
      };
    }

    // Créer un nouveau FormData avec le fichier
    const uploadFormData = new FormData();
    uploadFormData.append('avatar', file);

    const result = await forwardPost('/users/me/avatar', request, uploadFormData);
    return result.data;
  }, '/api/profile/avatar', 'POST');
}

/**
 * DELETE /api/profile/avatar
 * Supprime l'avatar de l'utilisateur
 * Forward vers backend NestJS: DELETE /users/me/avatar
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardDelete('/users/me/avatar', request);
    return result.data;
  }, '/api/profile/avatar', 'DELETE');
}
