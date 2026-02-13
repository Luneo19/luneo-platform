import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

type ShareTokenRouteContext = {
  params: Promise<{ token: string }>;
};

/**
 * GET /api/share/[token]
 * Récupère un design partagé via un token. Proxies to NestJS (public, no auth).
 */
export async function GET(request: NextRequest, { params }: ShareTokenRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { token } = await params;
    const res = await fetch(`${API_URL}/api/v1/share/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { message?: string }).message || 'Erreur lors de la récupération du partage';
      if (res.status === 404) throw { status: 404, message: 'Partage non trouvé ou expiré', code: 'SHARE_NOT_FOUND' };
      if (res.status === 400) throw { status: 410, message: 'Ce partage a expiré', code: 'SHARE_EXPIRED' };
      serverLogger.dbError('fetch share by token', new Error(`${msg} (token: ${token})`));
      throw { status: res.status, message: msg, code: 'SHARE_ERROR' };
    }
    const data = await res.json();
    serverLogger.info('Shared design accessed', { token });
    return { share: data.share ?? data };
  }, '/api/share/[token]', 'GET');
}

/**
 * POST /api/share/[token]/action
 * Enregistre une action sur un partage (download, ar_launch, etc.).
 * Validation only; analytics logging to be implemented in backend.
 */
export async function POST(request: Request, { params }: ShareTokenRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { action_type } = body;

    const validActions = ['download', 'ar_launch', 'share'];
    if (!action_type || !validActions.includes(action_type)) {
      throw {
        status: 400,
        message: `Action invalide. Actions valides: ${validActions.join(', ')}`,
        code: 'VALIDATION_ERROR',
      };
    }

    serverLogger.info('Share action', { token, actionType: action_type });
    return { message: 'Action enregistrée avec succès' };
  }, '/api/share/[token]/action', 'POST');
}
