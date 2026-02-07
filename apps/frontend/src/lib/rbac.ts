/**
 * 🔐 RBAC (Role-Based Access Control) - Luneo Platform
 *
 * Permission checks are forwarded to the backend API so that authorization
 * is enforced server-side. The frontend uses these helpers for UI (e.g. hiding
 * actions the user cannot perform); the backend must always enforce permissions
 * on each request.
 */

import { getServerUser } from '@/lib/auth/get-user';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  TEAM_MEMBER = 'team_member',
  OWNER = 'owner',
}

export interface Permission {
  resource: string;
  action: string;
}

export interface RBACResult {
  hasAccess: boolean;
  reason?: string;
  userRole?: UserRole;
}

/**
 * Vérifier si un utilisateur est admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Get user from backend API
    const user = await getServerUser();
    if (!user || user.id !== userId) {
      return false;
    }

    // Check role from backend user data
    const role = user.role?.toUpperCase();
    return role === 'PLATFORM_ADMIN' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  } catch (error) {
    logger.error('Error checking admin status', error instanceof Error ? error : new Error(String(error)), {
      userId,
    });
    return false;
  }
}

/**
 * Vérifier si un utilisateur est super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const user = await getServerUser();
    if (!user || user.id !== userId) {
      return false;
    }

    const role = user.role?.toUpperCase();
    return role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN';
  } catch (error) {
    logger.error('Error checking super admin status', error instanceof Error ? error : new Error(String(error)), {
      userId,
    });
    return false;
  }
}

/**
 * Check a single permission via the backend (current user from JWT/cookies).
 * Use this for UI decisions; the backend enforces permissions on every request.
 */
export async function checkPermission(
  permission: string,
  resource?: string,
  resourceId?: string,
): Promise<boolean> {
  try {
    const data = await api.post<{ allowed: boolean }>('/api/v1/auth/check-permission', {
      permission,
      resource,
      resourceId,
    });
    return data.allowed === true;
  } catch {
    return false;
  }
}

/**
 * Get the current user's permission list from the backend.
 */
export async function getUserPermissions(): Promise<string[]> {
  try {
    const data = await api.get<{ permissions: string[] }>('/api/v1/auth/permissions');
    return data.permissions ?? [];
  } catch {
    return [];
  }
}

/**
 * Vérifier si l'utilisateur courant a la permission (délégation au backend).
 * Le backend utilise l'utilisateur authentifié (JWT/cookies) pour la vérification.
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
): Promise<RBACResult> {
  try {
    const permissionStr = `${permission.resource}:${permission.action}`;
    const allowed = await checkPermission(permissionStr);
    if (allowed) {
      return { hasAccess: true };
    }
    return {
      hasAccess: false,
      reason: 'Permission denied by backend',
    };
  } catch (error) {
    logger.error('Error checking permission', error instanceof Error ? error : new Error(String(error)), {
      userId,
      permission,
    });
    return {
      hasAccess: false,
      reason: 'Permission check error',
    };
  }
}

/**
 * Vérifier si un utilisateur est propriétaire d'une ressource.
 * Admins sont considérés propriétaires pour l'accès. Un endpoint backend dédié
 * (ex. GET /api/v1/auth/check-ownership) pourrait être ajouté pour une vérification
 * stricte par ressource.
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  try {
    const adminStatus = await isAdmin(userId);
    if (adminStatus) {
      return true;
    }
    // Ownership checks could be forwarded to a future backend endpoint
    logger.warn('Resource ownership check not yet delegated to backend', {
      userId,
      resourceType,
      resourceId,
    });
    return false;
  } catch (error) {
    logger.error('Error checking resource ownership', error instanceof Error ? error : new Error(String(error)), {
      userId,
      resourceType,
      resourceId,
    });
    return false;
  }
}

/**
 * Middleware pour vérifier les permissions admin
 * À utiliser dans les routes API
 */
export async function requireAdmin(userId: string): Promise<void> {
  const adminStatus = await isAdmin(userId);
  
  if (!adminStatus) {
    logger.warn('Unauthorized admin access attempt', {
      userId,
    });
    throw {
      status: 403,
      message: 'Accès refusé - Permissions administrateur requises',
      code: 'FORBIDDEN',
    };
  }
}

/**
 * Middleware pour vérifier les permissions super admin
 */
export async function requireSuperAdmin(userId: string): Promise<void> {
  const superAdminStatus = await isSuperAdmin(userId);
  
  if (!superAdminStatus) {
    logger.warn('Unauthorized super admin access attempt', {
      userId,
    });
    throw {
      status: 403,
      message: 'Accès refusé - Permissions super administrateur requises',
      code: 'FORBIDDEN',
    };
  }
}

/**
 * Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
 */
export async function requireResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  const isOwner = await isResourceOwner(userId, resourceType, resourceId);
  
  if (!isOwner) {
    logger.warn('Unauthorized resource access attempt', {
      userId,
      resourceType,
      resourceId,
    });
    throw {
      status: 403,
      message: 'Accès refusé - Vous n\'êtes pas propriétaire de cette ressource',
      code: 'FORBIDDEN',
    };
  }
}

