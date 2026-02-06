/**
 * ★★★ ADMIN PERMISSIONS ★★★
 * Vérification des permissions admin pour le Super Admin Dashboard
 */

import { getServerUser } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { serverLogger } from '@/lib/logger-server';

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

    // Vérifier le rôle dans la base de données
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return false;
    }

    // Vérifier si l'utilisateur a le rôle PLATFORM_ADMIN
    return dbUser.role === 'PLATFORM_ADMIN';
  } catch (error) {
    serverLogger.error('[Admin Permissions] Error checking admin access', error);
    return false;
  }
}

/**
 * Vérifie l'accès admin et redirige si non autorisé
 * À utiliser dans les Server Components
 */
export async function requireAdminAccess(): Promise<AdminUser> {
  serverLogger.debug('[Admin Permissions] Checking admin access...');
  
  const user = await getServerUser();
  
  serverLogger.debug('[Admin Permissions] getServerUser result', { 
    found: !!user, 
    email: user?.email 
  });
  
  if (!user) {
    serverLogger.debug('[Admin Permissions] No user, redirecting to login');
    redirect('/login?redirect=/admin');
  }

  serverLogger.debug('[Admin Permissions] User role from JWT', { role: user.role });

  // Vérifier le rôle directement depuis le JWT (déjà vérifié par backend)
  // Si le rôle est PLATFORM_ADMIN dans le JWT, on peut faire confiance
  if (user.role === 'PLATFORM_ADMIN') {
    serverLogger.debug('[Admin Permissions] Access granted based on JWT role');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      brandId: user.brandId || null,
    };
  }

  // Fallback : Vérifier dans la DB (pour double vérification)
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      brandId: true,
      isActive: true,
    },
  });

  serverLogger.debug('[Admin Permissions] DB user check', {
    found: !!dbUser,
    role: dbUser?.role,
    isActive: dbUser?.isActive,
    isPlatformAdmin: dbUser?.role === 'PLATFORM_ADMIN',
  });

  if (!dbUser || !dbUser.isActive || dbUser.role !== 'PLATFORM_ADMIN') {
    serverLogger.debug('[Admin Permissions] Access denied, redirecting');
    redirect('/dashboard?error=unauthorized');
  }

  serverLogger.debug('[Admin Permissions] Access granted');
  
  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    brandId: dbUser.brandId,
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

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        brandId: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== 'PLATFORM_ADMIN') {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      brandId: dbUser.brandId,
    };
  } catch (error) {
    serverLogger.error('[Admin Permissions] Error getting admin user', error);
    return null;
  }
}
