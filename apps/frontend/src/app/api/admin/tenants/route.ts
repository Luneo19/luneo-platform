import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * GET /api/admin/tenants
 * Récupère tous les tenants (brands) - Admin seulement. Cookie-based auth, proxies to NestJS.
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const user = userRes.ok ? await userRes.json() : null;
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }
    if (user.role !== 'PLATFORM_ADMIN') {
      throw { status: 403, message: 'Accès réservé aux administrateurs', code: 'FORBIDDEN' };
    }

    const tenantsRes = await fetch(`${API_URL}/api/v1/admin/tenants`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!tenantsRes.ok) {
      logger.warn('Backend admin/tenants fetch failed', { status: tenantsRes.status, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des tenants' };
    }
    const data = await tenantsRes.json();
    const tenants = data.tenants ?? [];

    logger.info('Tenants fetched', { userId: user.id, count: tenants.length });
    return { tenants };
  }, '/api/admin/tenants', 'GET');
}
