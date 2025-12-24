/**
 * AUDIT LOGGING UTILITY
 * Helper functions pour logger des actions dans audit_logs
 * Usage: await auditLog.create('order', orderId, 'Commande créée');
 */

import { logger } from './logger';

export type AuditAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'register'
  | 'export' | 'import'
  | 'share' | 'download'
  | 'invite' | 'remove'
  | 'approve' | 'reject'
  | 'publish' | 'unpublish';

export type AuditResourceType =
  | 'order' | 'design' | 'product' | 'user'
  | 'api_key' | 'integration' | 'team_member'
  | 'subscription' | 'invoice' | 'payment'
  | 'collection' | 'export' | 'import';

export type AuditSensitivity = 'low' | 'normal' | 'high' | 'critical';
export type AuditStatus = 'success' | 'failure' | 'warning';

export interface AuditLogData {
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id?: string;
  resource_name?: string;
  description?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
  status?: AuditStatus;
  sensitivity?: AuditSensitivity;
}

/**
 * Log une action dans les audit logs
 */
export async function logAudit(data: AuditLogData): Promise<boolean> {
  try {
    const response = await fetch('/api/audit/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    logger.error('Erreur audit log', {
      error,
      auditData: data,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Helpers pour actions courantes
 */
export const auditLog = {
  // CRUD Operations
  create: async (
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    metadata?: Record<string, any>
  ) => {
    return logAudit({
      action: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      description: `${resourceType} créé(e)`,
      metadata,
      status: 'success',
      sensitivity: 'normal'
    });
  },

  update: async (
    resourceType: AuditResourceType,
    resourceId: string,
    changes: { before: any; after: any },
    resourceName?: string
  ) => {
    return logAudit({
      action: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      description: `${resourceType} mis(e) à jour`,
      changes,
      status: 'success',
      sensitivity: 'normal'
    });
  },

  delete: async (
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string
  ) => {
    return logAudit({
      action: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      description: `${resourceType} supprimé(e)`,
      status: 'success',
      sensitivity: 'high'
    });
  },

  read: async (
    resourceType: AuditResourceType,
    resourceId: string,
    sensitivity: AuditSensitivity = 'low'
  ) => {
    return logAudit({
      action: 'read',
      resource_type: resourceType,
      resource_id: resourceId,
      description: `${resourceType} consulté(e)`,
      status: 'success',
      sensitivity
    });
  },

  // Authentication
  login: async (email: string, method: 'email' | 'google' | 'github' = 'email') => {
    return logAudit({
      action: 'login',
      resource_type: 'user',
      description: `Connexion réussie via ${method}`,
      metadata: { method },
      status: 'success',
      sensitivity: 'high'
    });
  },

  loginFailed: async (email: string, reason: string) => {
    return logAudit({
      action: 'login',
      resource_type: 'user',
      description: `Tentative de connexion échouée: ${reason}`,
      metadata: { email, reason },
      status: 'failure',
      sensitivity: 'critical'
    });
  },

  logout: async () => {
    return logAudit({
      action: 'logout',
      resource_type: 'user',
      description: 'Déconnexion',
      status: 'success',
      sensitivity: 'normal'
    });
  },

  // Data Export (RGPD)
  exportData: async (dataType: string, format: string = 'json') => {
    return logAudit({
      action: 'export',
      resource_type: 'export',
      description: `Export de données: ${dataType}`,
      metadata: { dataType, format },
      status: 'success',
      sensitivity: 'high'
    });
  },

  // Sensitive Actions
  changePermissions: async (
    userId: string,
    oldRole: string,
    newRole: string
  ) => {
    return logAudit({
      action: 'update',
      resource_type: 'user',
      resource_id: userId,
      description: `Changement de permissions`,
      changes: {
        before: { role: oldRole },
        after: { role: newRole }
      },
      status: 'success',
      sensitivity: 'critical'
    });
  },

  // API Keys
  createApiKey: async (keyId: string, keyName: string) => {
    return logAudit({
      action: 'create',
      resource_type: 'api_key',
      resource_id: keyId,
      resource_name: keyName,
      description: `Clé API créée: ${keyName}`,
      status: 'success',
      sensitivity: 'high'
    });
  },

  deleteApiKey: async (keyId: string, keyName: string) => {
    return logAudit({
      action: 'delete',
      resource_type: 'api_key',
      resource_id: keyId,
      resource_name: keyName,
      description: `Clé API supprimée: ${keyName}`,
      status: 'success',
      sensitivity: 'high'
    });
  },

  // Payments
  paymentSucceeded: async (orderId: string, amount: number, currency: string) => {
    return logAudit({
      action: 'create',
      resource_type: 'payment',
      resource_id: orderId,
      description: `Paiement réussi`,
      metadata: { amount, currency },
      status: 'success',
      sensitivity: 'high'
    });
  },

  paymentFailed: async (orderId: string, reason: string) => {
    return logAudit({
      action: 'create',
      resource_type: 'payment',
      resource_id: orderId,
      description: `Paiement échoué: ${reason}`,
      metadata: { reason },
      status: 'failure',
      sensitivity: 'high'
    });
  },

  // Subscription Changes
  subscriptionChanged: async (
    oldPlan: string,
    newPlan: string,
    subscriptionId: string
  ) => {
    return logAudit({
      action: 'update',
      resource_type: 'subscription',
      resource_id: subscriptionId,
      description: `Changement d'abonnement`,
      changes: {
        before: { plan: oldPlan },
        after: { plan: newPlan }
      },
      status: 'success',
      sensitivity: 'high'
    });
  },

  // Team Management
  inviteTeamMember: async (email: string, role: string) => {
    return logAudit({
      action: 'invite',
      resource_type: 'team_member',
      description: `Invitation envoyée à ${email}`,
      metadata: { email, role },
      status: 'success',
      sensitivity: 'normal'
    });
  },

  removeTeamMember: async (memberId: string, memberEmail: string) => {
    return logAudit({
      action: 'remove',
      resource_type: 'team_member',
      resource_id: memberId,
      description: `Membre retiré: ${memberEmail}`,
      metadata: { email: memberEmail },
      status: 'success',
      sensitivity: 'high'
    });
  }
};

/**
 * Hook React pour faciliter l'usage dans les composants
 */
export function useAuditLog() {
  return auditLog;
}

/**
 * Higher-order function pour wrapper des actions avec audit automatique
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  auditFn: () => Promise<boolean>
): T {
  return (async (...args: any[]) => {
    const result = await fn(...args);
    await auditFn();
    return result;
  }) as T;
}

