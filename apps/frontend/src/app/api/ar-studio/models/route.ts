import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardDelete } from '@/lib/backend-forward';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/ar-studio/models
 * Liste tous les modèles AR pour la marque de l'utilisateur
 * Forward vers backend NestJS: GET /api/ar-studio/models
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet<{ models: unknown[] }>('/ar-studio/models', request);
    return { models: result.data?.models || [] };
  }, '/api/ar-studio/models', 'GET');
}

/**
 * POST /api/ar-studio/models
 * Upload un nouveau modèle AR
 * Forward vers backend NestJS: POST /api/ar-studio/models
 * Note: Upload de fichier nécessite FormData, le backend doit gérer cela
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Pour l'upload de fichier, on doit forwarder le FormData directement
    const formData = await request.formData();
    
    // Utiliser forwardToBackend avec FormData
    const { forwardToBackend } = await import('@/lib/backend-forward');
    const result = await forwardToBackend('/ar-studio/models', request, {
      method: 'POST',
      body: formData,
    });

    return {
      model: (result.data as any)?.model || result.data,
      message: (result.data as any)?.message || 'Modèle AR uploadé avec succès',
    };
  }, '/api/ar-studio/models', 'POST');
}

/**
 * DELETE /api/ar-studio/models?id=xxx
 * Supprime un modèle AR
 * Forward vers backend NestJS: DELETE /api/ar-studio/models/:id
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardDelete(`/ar-studio/models/${modelId}`, request);
    return {
      message: (result.data as any)?.message || 'Modèle AR supprimé avec succès',
    };
  }, '/api/ar-studio/models', 'DELETE');
}
