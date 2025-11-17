import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

/**
 * Types d'événements auditables
 */
export enum AuditEventType {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_INVITED = 'user.invited',

  // Brand Management
  BRAND_CREATED = 'brand.created',
  BRAND_UPDATED = 'brand.updated',
  BRAND_DELETED = 'brand.deleted',

  // Product Management
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PUBLISHED = 'product.published',

  // Design Management
  DESIGN_CREATED = 'design.created',
  DESIGN_UPDATED = 'design.updated',
  DESIGN_DELETED = 'design.deleted',
  DESIGN_APPROVED = 'design.approved',

  // Order Management
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_REFUNDED = 'order.refunded',

  // Billing
  BILLING_UPDATED = 'billing.updated',
  INVOICE_GENERATED = 'billing.invoice_generated',
  PAYMENT_SUCCEEDED = 'billing.payment_succeeded',
  PAYMENT_FAILED = 'billing.payment_failed',

  // Settings
  SETTINGS_UPDATED = 'settings.updated',

  // Integrations
  INTEGRATION_CREATED = 'integration.created',
  INTEGRATION_UPDATED = 'integration.updated',
  INTEGRATION_DELETED = 'integration.deleted',
  INTEGRATION_SYNCED = 'integration.synced',

  // API & Security
  API_KEY_CREATED = 'api.key_created',
  API_KEY_DELETED = 'api.key_deleted',
  WEBHOOK_CREATED = 'webhook.created',
  WEBHOOK_DELETED = 'webhook.deleted',
  ACCESS_DENIED = 'security.access_denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',

  // GDPR
  DATA_EXPORTED = 'gdpr.data_exported',
  DATA_DELETED = 'gdpr.data_deleted',
  CONSENT_GIVEN = 'gdpr.consent_given',
  CONSENT_WITHDRAWN = 'gdpr.consent_withdrawn',
}

/**
 * Interface pour un log d'audit
 */
export interface AuditLog {
  id?: string;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  brandId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

/**
 * Service de gestion des logs d'audit
 * Traçabilité complète et immuable de toutes les actions
 */
@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un log d'audit
   */
  async log(log: AuditLog): Promise<void> {
    try {
      // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
      await (this.prisma as any).auditLog.create({
        data: {
          eventType: log.eventType,
          userId: log.userId,
          // userEmail: log.userEmail, // Commenté car pas dans AuditLogCreateInput
          // brandId: log.brandId, // Commenté car pas dans AuditLogCreateInput
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          action: log.action,
          metadata: log.metadata || {},
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          success: log.success,
          // errorMessage: log.errorMessage, // Commenté car pas dans AuditLogCreateInput
          timestamp: log.timestamp || new Date(),
        },
      });

      // Log aussi dans les logs applicatifs pour debugging
      const logLevel = log.success ? 'log' : 'warn';
      this.logger[logLevel](
        `Audit: ${log.eventType} by ${log.userEmail || log.userId} - ${log.action}`,
      );
    } catch (error) {
      // CRITICAL: Ne jamais faire échouer l'opération métier si l'audit échoue
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Logger une action réussie
   */
  async logSuccess(
    eventType: AuditEventType,
    action: string,
    context: {
      userId?: string;
      userEmail?: string;
      brandId?: string;
      resourceType?: string;
      resourceId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    await this.log({
      eventType,
      action,
      success: true,
      timestamp: new Date(),
      ...context,
    });
  }

  /**
   * Logger une action échouée
   */
  async logFailure(
    eventType: AuditEventType,
    action: string,
    error: string,
    context: {
      userId?: string;
      userEmail?: string;
      brandId?: string;
      resourceType?: string;
      resourceId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    await this.log({
      eventType,
      action,
      success: false,
      errorMessage: error,
      timestamp: new Date(),
      ...context,
    });
  }

  /**
   * Rechercher des logs d'audit
   */
  async search(filters: {
    userId?: string;
    brandId?: string;
    eventType?: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.brandId) where.brandId = filters.brandId;
      if (filters.eventType) where.eventType = filters.eventType;
      if (filters.resourceType) where.resourceType = filters.resourceType;
      if (filters.resourceId) where.resourceId = filters.resourceId;
      if (filters.success !== undefined) where.success = filters.success;

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
        (this.prisma as any).auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        }),
        // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
        (this.prisma as any).auditLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      this.logger.error(`Failed to search audit logs: ${error.message}`, error.stack);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Récupérer l'historique d'une ressource
   */
  async getResourceHistory(
    resourceType: string,
    resourceId: string,
  ): Promise<any[]> {
    try {
      // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
      return await (this.prisma as any).auditLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        orderBy: { timestamp: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get resource history: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Récupérer l'activité d'un utilisateur
   */
  async getUserActivity(
    userId: string,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
      return await (this.prisma as any).auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get user activity: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Statistiques d'audit
   */
  async getStats(brandId?: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        timestamp: { gte: startDate },
      };
      if (brandId) where.brandId = brandId;

      const [total, success, failures, byEventType] = await Promise.all([
        // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
        (this.prisma as any).auditLog.count({ where }),
        // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
        (this.prisma as any).auditLog.count({ where: { ...where, success: true } }),
        // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
        (this.prisma as any).auditLog.count({ where: { ...where, success: false } }),
        // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
        (this.prisma as any).auditLog.groupBy({
          by: ['eventType'],
          where,
          _count: true,
          orderBy: { _count: { eventType: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        period: { days, startDate, endDate: new Date() },
        total,
        success,
        failures,
        successRate: total > 0 ? (success / total) * 100 : 0,
        topEvents: byEventType.map((e) => ({
          eventType: e.eventType,
          count: e._count,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get audit stats: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Exporter des logs en CSV
   */
  async exportToCSV(filters: any): Promise<string> {
    try {
      const { logs } = await this.search({ ...filters, limit: 10000 });

      let csv = 'Timestamp,Event Type,User,Brand,Action,Resource,Success,IP,Error\n';

      for (const log of logs) {
        const timestamp = log.timestamp.toISOString();
        const eventType = log.eventType;
        const user = log.userEmail || log.userId || 'N/A';
        const brand = log.brandId || 'N/A';
        const action = log.action;
        const resource = log.resourceId
          ? `${log.resourceType}:${log.resourceId}`
          : 'N/A';
        const success = log.success ? 'Yes' : 'No';
        const ip = log.ipAddress || 'N/A';
        const error = log.errorMessage || '';

        csv += `${timestamp},${eventType},${user},${brand},${action},${resource},${success},${ip},"${error}"\n`;
      }

      return csv;
    } catch (error) {
      this.logger.error(`Failed to export CSV: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Détecter des activités suspectes
   */
  async detectSuspiciousActivity(userId: string): Promise<any[]> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Rechercher les échecs multiples
      // @ts-ignore - auditLog exists in schema but Prisma client may need regeneration
      const recentFailures = await (this.prisma as any).auditLog.findMany({
        where: {
          userId,
          success: false,
          timestamp: { gte: oneHourAgo },
        },
        orderBy: { timestamp: 'desc' },
      });

      const alerts = [];

      // Alerte si > 5 échecs en 1h
      if (recentFailures.length > 5) {
        alerts.push({
          type: 'multiple_failures',
          severity: 'high',
          message: `${recentFailures.length} failed actions in the last hour`,
          count: recentFailures.length,
        });
      }

      // Alerte si accès refusés répétés
      const accessDenied = recentFailures.filter(
        (f) => f.eventType === AuditEventType.ACCESS_DENIED,
      );
      if (accessDenied.length > 3) {
        alerts.push({
          type: 'repeated_access_denied',
          severity: 'medium',
          message: `${accessDenied.length} access denied events`,
          count: accessDenied.length,
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error(
        `Failed to detect suspicious activity: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}

