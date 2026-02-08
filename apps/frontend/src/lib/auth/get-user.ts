/**
 * ★★★ AUTH HELPER - GET USER ★★★
 * Helper pour récupérer l'utilisateur depuis la session
 * ✅ Utilise JWT backend (cookies httpOnly)
 * - Support cookies JWT
 * - Appel direct au backend NestJS
 */

import { getBackendUrl } from '@/lib/api/server-url';
import { cookies } from 'next/headers';
import { serverLogger } from '@/lib/logger-server';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  brandId?: string;
}

/**
 * Récupère l'utilisateur depuis les cookies JWT (backend NestJS)
 * Appelle directement le backend /api/v1/auth/me avec les cookies
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return null;
    }

    const refreshToken = cookieStore.get('refreshToken')?.value || '';
    const cookieHeader = refreshToken
      ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
      : `accessToken=${accessToken}`;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.id) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role || undefined,
      brandId: data.brandId || undefined,
    };
  } catch (error) {
    serverLogger.error('[getServerUser] Error getting server user', error);
    return null;
  }
}

/**
 * Récupère l'utilisateur depuis la requête (API Route)
 * ✅ Utilise JWT backend (cookies httpOnly)
 */
export async function getUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  try {
    // Extract token from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookieMap = cookieHeader
      ? Object.fromEntries(
          cookieHeader.split('; ').map((c) => {
            const [key, ...values] = c.split('=');
            return [key, decodeURIComponent(values.join('='))];
          })
        )
      : {};

    const accessToken = cookieMap['accessToken'];
    
    if (!accessToken) {
      // Try Authorization header as fallback
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.replace('Bearer ', '');
      if (!bearerToken) {
        return null;
      }
    }

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data || !data.id) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role || undefined,
      brandId: data.brandId || undefined,
    };
  } catch (error) {
    serverLogger.error('[getUserFromRequest] Error getting user from request', error);
    return null;
  }
}

