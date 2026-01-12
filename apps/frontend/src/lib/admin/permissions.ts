/**
 * ★★★ ADMIN PERMISSIONS ★★★
 * Vérification des permissions admin pour le Super Admin Dashboard
 */

import { getServerUser } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

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
    console.error('[Admin Permissions] Error checking admin access:', error);
    return false;
  }
}

/**
 * Vérifie l'accès admin et redirige si non autorisé
 * À utiliser dans les Server Components
 */
export async function requireAdminAccess(): Promise<AdminUser> {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/login?redirect=/admin');
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
    redirect('/dashboard?error=unauthorized');
  }

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
    console.error('[Admin Permissions] Error getting admin user:', error);
    return null;
  }
}
