import { getUserFromRequest } from '@/lib/auth/get-user';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { idSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { apiRateLimit } from '@/lib/rate-limit';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/designs/[id]/versions/auto
 * Crée automatiquement une version avant une mise à jour
 * 
 * Cette route doit être appelée AVANT chaque update de design
 * pour créer automatiquement une sauvegarde
 * Système de versioning automatique complet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    
    // Validation UUID
    const uuidValidation = idSchema.safeParse(designId);
    if (!uuidValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting - Protection contre spam de versions auto
    const identifier = getClientIdentifier(request, user.id);
    const rateLimitResult = await checkRateLimit(identifier, apiRateLimit);
    
    if (!rateLimitResult.success) {
      throw {
        status: 429,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          reset: rateLimitResult.reset.toISOString(),
          remaining: rateLimitResult.remaining,
        },
      };
    }

    // Validation body avec Zod
    const autoVersionSchema = z.object({
      auto_save: z.boolean().optional().default(true),
    });

    let body;
    try {
      body = await request.json();
    } catch {
      throw { status: 400, message: 'Body JSON invalide', code: 'INVALID_JSON' };
    }

    const validatedBody = autoVersionSchema.parse(body);

    // Forward to backend API
    const backendResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/versions/auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(validatedBody),
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      const errorText = await backendResponse.text();
      logger.error('Failed to create auto version', {
        designId,
        userId: user.id,
        status: backendResponse.status,
        error: errorText,
      });
      // Ne pas bloquer l'update si le versioning échoue
      return {
        skipped: true,
        warning: true,
        reason: 'Erreur lors de la création de la version automatique (non bloquant)',
        message: 'L\'update du design peut continuer',
      };
    }

    const result = await backendResponse.json();
    logger.info('Auto design version created', {
      designId,
      versionId: result.version_id,
      versionNumber: result.version_number,
      userId: user.id,
    });

    return result;
  }, '/api/designs/[id]/versions/auto', 'POST');
}

