/**
 * 🔐 RBAC (Role-Based Access Control) - Luneo Platform
 * 
 * Système de gestion des permissions et rôles utilisateur
 * Pour un SaaS professionnel et sécurisé
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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
    const supabase = await createClient();
    
    // Vérifier dans user_metadata
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return false;
    }

    const userRole = user.user_metadata?.role || user.user_metadata?.is_admin;
    
    // Vérifier si admin dans metadata
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN || user.user_metadata?.is_admin === true) {
      return true;
    }

    // Vérifier dans table users si elle existe
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role, is_admin')
      .eq('id', userId)
      .single();

    if (dbError) {
      // Table users n'existe peut-être pas, on utilise seulement metadata
      logger.warn('Failed to check user role in database', {
        userId,
        error: dbError.message,
      });
      return false;
    }

    return (
      userData?.role === UserRole.ADMIN ||
      userData?.role === UserRole.SUPER_ADMIN ||
      userData?.is_admin === true
    );
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
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return false;
    }

    const userRole = user.user_metadata?.role;
    
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Vérifier dans table users si elle existe
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (dbError) {
      return false;
    }

    return userData?.role === UserRole.SUPER_ADMIN;
  } catch (error) {
    logger.error('Error checking super admin status', error instanceof Error ? error : new Error(String(error)), {
      userId,
    });
    return false;
  }
}

/**
 * Vérifier si un utilisateur a accès à une ressource
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<RBACResult> {
  try {
    const supabase = await createClient();
    
    // Vérifier si admin (admins ont tous les accès)
    const adminStatus = await isAdmin(userId);
    if (adminStatus) {
      return {
        hasAccess: true,
        userRole: UserRole.ADMIN,
      };
    }

    // Vérifier permissions spécifiques dans table permissions si elle existe
    const { data: permissions, error: permError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('resource', permission.resource)
      .eq('action', permission.action)
      .eq('is_active', true);

    if (permError) {
      // Table permissions n'existe peut-être pas, on utilise seulement admin
      logger.warn('Failed to check user permissions in database', {
        userId,
        permission,
        error: permError.message,
      });
      
      // Par défaut, seul admin a accès
      return {
        hasAccess: false,
        reason: 'Permission check failed - admin access required',
      };
    }

    if (permissions && permissions.length > 0) {
      return {
        hasAccess: true,
      };
    }

    return {
      hasAccess: false,
      reason: 'User does not have required permission',
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
 * Vérifier si un utilisateur est propriétaire d'une ressource
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Admins peuvent accéder à tout
    const adminStatus = await isAdmin(userId);
    if (adminStatus) {
      return true;
    }

    // Vérifier ownership dans la table correspondante
    const { data, error } = await supabase
      .from(resourceType)
      .select('user_id, owner_id')
      .eq('id', resourceId)
      .single();

    if (error) {
      logger.warn('Failed to check resource ownership', {
        userId,
        resourceType,
        resourceId,
        error: error.message,
      });
      return false;
    }

    return data?.user_id === userId || data?.owner_id === userId;
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

