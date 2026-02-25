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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isJwtExpired(payload: Record<string, unknown> | null): boolean {
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== 'number') return true;
  return exp * 1000 <= Date.now();
}

/**
 * Récupère l'utilisateur depuis les cookies JWT (backend NestJS)
 * Appelle directement le backend /api/v1/auth/me avec les cookies
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value || '';
    if (!accessToken && !refreshToken) {
      return null;
    }

    // Fast-path for SSR/admin routes: decode access token locally to avoid
    // transient backend /auth/me or /auth/refresh races causing redirect loops.
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      if (!isJwtExpired(payload)) {
        const sub = payload?.sub;
        const email = payload?.email;
        const role = payload?.role;
        if (sub && email) {
          return {
            id: String(sub),
            email: String(email),
            role: role ? String(role) : undefined,
            brandId: payload?.brandId ? String(payload.brandId) : undefined,
          };
        }
      }
    }

    const cookieHeader = accessToken
      ? (refreshToken
          ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
          : `accessToken=${accessToken}`)
      : `refreshToken=${refreshToken}`;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      // Backend may return { id, email, ... } directly
      // OR wrapped: { success: true, data: { id, email, ... } }
      const user = data?.data || data;
      if (user && user.id) {
        return {
          id: user.id,
          email: user.email,
          role: user.role || undefined,
          brandId: user.brandId || undefined,
        };
      }
    }

    // If access token expired (401), try server-side refresh with refreshToken
    if (response.status === 401 && refreshToken) {
      serverLogger.debug('[getServerUser] Access token expired, attempting server-side refresh');
      try {
        const refreshResp = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          cache: 'no-store',
        });

        if (refreshResp.ok) {
          // Extract new cookies from refresh response Set-Cookie headers
          const setCookies = refreshResp.headers.getSetCookie?.() || [];
          const newCookieHeader = setCookies.length > 0
            ? setCookies.map(c => c.split(';')[0]).join('; ')
            : cookieHeader;

          // Retry /auth/me with new cookies
          const retryResp = await fetch(`${backendUrl}/api/v1/auth/me`, {
            method: 'GET',
            headers: {
              Cookie: newCookieHeader,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          });

          if (retryResp.ok) {
            const data = await retryResp.json();
            // Handle wrapped response format
            const user = data?.data || data;
            if (user && user.id) {
              serverLogger.debug('[getServerUser] Server-side refresh successful');
              return {
                id: user.id,
                email: user.email,
                role: user.role || undefined,
                brandId: user.brandId || undefined,
              };
            }
          }
        }
      } catch (refreshError) {
        serverLogger.error('[getServerUser] Server-side refresh failed', refreshError);
      }
    }

    return null;
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
    // Handle wrapped response: { success: true, data: { id, email, ... } }
    // or direct response: { id, email, ... }
    const user = data?.data || data;
    
    if (!user || !user.id) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role || undefined,
      brandId: user.brandId || undefined,
    };
  } catch (error) {
    serverLogger.error('[getUserFromRequest] Error getting user from request', error);
    return null;
  }
}

