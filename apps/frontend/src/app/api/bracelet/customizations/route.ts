import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/bracelet/customizations
 * 
 * Enregistre une personnalisation de bracelet
 * 
 * @body {
 *   text: string;
 *   font: string;
 *   fontSize: number;
 *   alignment: string;
 *   position: string;
 *   color: string;
 *   material: string;
 *   texture?: string; // base64 data URL
 *   model: string;
 * }
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    if (!user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    const body = await request.json();
    const {
      text,
      font,
      fontSize,
      alignment,
      position,
      color,
      material,
      texture,
      model,
    } = body;

    // Validation
    if (!text || text.length > 50) {
      return ApiResponseBuilder.badRequest('Le texte doit contenir entre 1 et 50 caractères');
    }

    if (!font || !fontSize || !alignment || !position || !color || !material) {
      return ApiResponseBuilder.badRequest('Tous les paramètres sont requis');
    }

    // Forward to backend API
    const backendResponse = await fetch(`${API_URL}/api/v1/bracelet/customizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        text,
        font,
        fontSize,
        alignment,
        position,
        color,
        material,
        texture,
        model: model || 'bracelet.glb',
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Failed to save customization', {
        userId: user.id,
        status: backendResponse.status,
        error: errorText,
      });
      return ApiResponseBuilder.internalError('Erreur lors de l\'enregistrement de la personnalisation');
    }

    const result = await backendResponse.json();
    logger.info('Bracelet customization saved', { id: result.id, userId: user.id });

    return result;
  }, '/api/bracelet/customizations', 'POST');
}

/**
 * GET /api/bracelet/customizations
 * 
 * Récupère les personnalisations de l'utilisateur
 */
