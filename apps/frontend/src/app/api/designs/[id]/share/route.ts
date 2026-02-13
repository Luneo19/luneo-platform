import { getUserFromRequest } from '@/lib/auth/get-user';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { shareDesignSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

type DesignShareRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/designs/[id]/share
 * Crée un lien de partage pour un design. Forwards to NestJS backend.
 */
export async function POST(request: Request, { params }: DesignShareRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const validation = shareDesignSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const backendResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        expires_in_days: validation.data.expires_in_days,
        password: validation.data.password,
      }),
    });

    if (!backendResponse.ok) {
      const err = await backendResponse.json().catch(() => ({}));
      if (backendResponse.status === 404) {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      throw {
        status: backendResponse.status,
        message: (err as { message?: string }).message || 'Erreur lors de la création du partage',
        code: 'SHARE_ERROR',
      };
    }

    const data = await backendResponse.json();
    serverLogger.info('Design share created', { designId, userId: user.id });

    return ApiResponseBuilder.success(
      data.share ? { share: data.share } : data,
      'Lien de partage créé avec succès',
      201
    );
  }, '/api/designs/[id]/share', 'POST');
}

/**
 * GET /api/designs/[id]/share
 * Récupère le(s) lien(s) de partage existant(s) pour un design. Forwards to NestJS backend.
 */
export async function GET(request: Request, { params }: DesignShareRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const backendResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/share`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      throw {
        status: backendResponse.status,
        message: 'Erreur lors de la récupération du partage',
        code: 'SHARE_ERROR',
      };
    }

    const data = await backendResponse.json();
    return ApiResponseBuilder.success({ shares: data.shares ?? [] });
  }, '/api/designs/[id]/share', 'GET');
}
