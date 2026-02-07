import { getUserFromRequest } from '@/lib/auth/get-user';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { idSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { apiRateLimit } from '@/lib/rate-limit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * GET /api/designs/[id]/versions/[versionId]
 * Récupère une version spécifique d'un design
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId, versionId } = await params;
    const user = await getUserFromRequest(request);

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Validation des UUIDs avec Zod
    const designIdValidation = idSchema.safeParse(designId);
    const versionIdValidation = idSchema.safeParse(versionId);
    
    if (!designIdValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }
    if (!versionIdValidation.success) {
      throw { status: 400, message: 'ID de version invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    // Forward to backend API
    const backendResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/versions/${versionId}`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw { status: 404, message: 'Version non trouvée', code: 'VERSION_NOT_FOUND' };
      }
      logger.error('Failed to fetch design version', {
        designId,
        versionId,
        userId: user.id,
        status: backendResponse.status,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la version' };
    }

    const { version } = await backendResponse.json();
    logger.info('Design version fetched', {
      designId,
      versionId,
      userId: user.id,
    });

    return { version };
  }, '/api/designs/[id]/versions/[versionId]', 'GET');
}

/**
 * POST /api/designs/[id]/versions/[versionId]/restore
 * Restaure une version (crée une nouvelle version avec les données de l'ancienne)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId, versionId } = await params;
    const user = await getUserFromRequest(request);

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
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

    // Validation des UUIDs avec Zod
    const designIdValidation = idSchema.safeParse(designId);
    const versionIdValidation = idSchema.safeParse(versionId);
    
    if (!designIdValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }
    if (!versionIdValidation.success) {
      throw { status: 400, message: 'ID de version invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    // Forward to backend API
    const backendResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/versions/${versionId}/restore`, {
      method: 'POST',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw { status: 404, message: 'Version non trouvée', code: 'VERSION_NOT_FOUND' };
      }
      logger.error('Failed to restore design version', {
        designId,
        versionId,
        userId: user.id,
        status: backendResponse.status,
      });
      throw { status: 500, message: 'Erreur lors de la restauration de la version' };
    }

    const result = await backendResponse.json();
    logger.info('Design version restored', {
      designId,
      versionId,
      restoredVersionId: result.version?.id,
      userId: user.id,
    });

    return result;
  }, '/api/designs/[id]/versions/[versionId]/restore', 'POST');
}

/**
 * DELETE /api/designs/[id]/versions/[versionId]
 * Supprime une version d'un design
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId, versionId } = await params;
    const user = await getUserFromRequest(request);

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
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

    // Validation des UUIDs avec Zod
    const designIdValidation = idSchema.safeParse(designId);
    const versionIdValidation = idSchema.safeParse(versionId);
    
    if (!designIdValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }
    if (!versionIdValidation.success) {
      throw { status: 400, message: 'ID de version invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    // Forward to backend API
    const backendResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/versions/${versionId}`, {
      method: 'DELETE',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw { status: 404, message: 'Version non trouvée', code: 'VERSION_NOT_FOUND' };
      }
      logger.error('Failed to delete design version', {
        designId,
        versionId,
        userId: user.id,
        status: backendResponse.status,
      });
      throw { status: 500, message: 'Erreur lors de la suppression de la version' };
    }

    const result = await backendResponse.json();
    logger.info('Design version deleted', {
      designId,
      versionId,
      userId: user.id,
    });

    return result;
  }, '/api/designs/[id]/versions/[versionId]', 'DELETE');
}

