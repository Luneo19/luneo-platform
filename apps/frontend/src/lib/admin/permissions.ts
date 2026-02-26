/**
 * ★★★ ADMIN PERMISSIONS ★★★
 * Vérification des permissions admin pour le Super Admin Dashboard
 */

import { getServerUser } from '@/lib/auth/get-user';
import { getBackendUrl } from '@/lib/api/server-url';
import { redirect } from 'next/navigation';
import { serverLogger } from '@/lib/logger-server';

const API_BASE = getBackendUrl();

async function fetchAuthMe(cookie: string | null): Promise<{ id: string; email: string; role: string; brandId?: string | null; isActive?: boolean } | null> {
  if (!cookie) return null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Backend may return { success: true, data: { id, email, ... } }
    // or directly { id, email, ... }
    const user = json?.data || json;
    if (!user || !user.id) return null;
    return user;
  } catch {
    return null;
  }
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  brandId?: string | null;
}

/**
 * Vérifie si l'utilisateur actuel est un admin de la plateforme
 * Utilise le rôle PLATFORM_ADMIN depuis la base de données
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return false;
    }

    const { headers } = await import('next/headers');
    const cookie = (await headers()).get('cookie');
    const dbUser = await fetchAuthMe(cookie);

    if (!dbUser || dbUser.isActive === false) {
      return false;
    }

    return dbUser.role === 'PLATFORM_ADMIN' || dbUser.role === 'ADMIN';
  } catch (error) {
    serverLogger.error('[Admin Permissions] Error checking admin access', error);
    return false;
  }
}

/**
 * Vérifie l'accès admin et redirige si non autorisé
 * À utiliser dans les Server Components
 */
export async function requireAdminAccess(): Promise<AdminUser | null> {
  serverLogger.debug('[Admin Permissions] Checking admin access...');
  
  let user: Awaited<ReturnType<typeof getServerUser>>;
  try {
    user = await getServerUser();
  } catch (err) {
    serverLogger.warn('[Admin Permissions] getServerUser threw', { error: String(err) });
    return null;
  }
  
  serverLogger.debug('[Admin Permissions] getServerUser result', { 
    found: !!user, 
    email: user?.email 
  });
  
  if (!user) {
    serverLogger.debug('[Admin Permissions] No user during SSR check, deferring to client guard');
    return null;
  }

  serverLogger.debug('[Admin Permissions] User role from JWT', { role: user.role });

  if (user.role === 'PLATFORM_ADMIN' || user.role === 'ADMIN') {
    serverLogger.debug('[Admin Permissions] Access granted based on JWT role');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      brandId: user.brandId || null,
    };
  }

  const { headers } = await import('next/headers');
  const cookie = (await headers()).get('cookie');
  const dbUser = await fetchAuthMe(cookie);

  serverLogger.debug('[Admin Permissions] API user check', {
    found: !!dbUser,
    role: dbUser?.role,
    isActive: dbUser?.isActive,
    isPlatformAdmin: dbUser?.role === 'PLATFORM_ADMIN',
  });

  if (!dbUser || dbUser.isActive === false) {
    serverLogger.debug('[Admin Permissions] No active DB user during SSR check, deferring to client guard');
    return null;
  }

  if (dbUser.role !== 'PLATFORM_ADMIN' && dbUser.role !== 'ADMIN') {
    serverLogger.debug('[Admin Permissions] Access denied, redirecting to overview');
    redirect('/overview');
  }

  serverLogger.debug('[Admin Permissions] Access granted');

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    brandId: dbUser.brandId ?? null,
  };
}

/**
 * Vérifie l'accès admin pour les API routes
 * Retourne l'utilisateur admin ou null
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return null;
    }

    const { headers } = await import('next/headers');
    const cookie = (await headers()).get('cookie');
    const dbUser = await fetchAuthMe(cookie);

    if (!dbUser || dbUser.isActive === false || (dbUser.role !== 'PLATFORM_ADMIN' && dbUser.role !== 'ADMIN')) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      brandId: dbUser.brandId ?? null,
    };
  } catch (error) {
    serverLogger.error('[Admin Permissions] Error getting admin user', error);
    return null;
  }
}
