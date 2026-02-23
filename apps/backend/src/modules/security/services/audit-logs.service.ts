import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

export enum AuditEventType {
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_INVITED = 'user.invited',
  BRAND_CREATED = 'brand.created',
  BRAND_UPDATED = 'brand.updated',
  BRAND_DELETED = 'brand.deleted',
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PUBLISHED = 'product.published',
  DESIGN_CREATED = 'design.created',
  DESIGN_UPDATED = 'design.updated',
  DESIGN_DELETED = 'design.deleted',
  DESIGN_APPROVED = 'design.approved',
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_REFUNDED = 'order.refunded',
  BILLING_UPDATED = 'billing.updated',
  INVOICE_GENERATED = 'billing.invoice_generated',
  PAYMENT_SUCCEEDED = 'billing.payment_succeeded',
  PAYMENT_FAILED = 'billing.payment_failed',
  SETTINGS_UPDATED = 'settings.updated',
  INTEGRATION_CREATED = 'integration.created',
  INTEGRATION_UPDATED = 'integration.updated',
  INTEGRATION_DELETED = 'integration.deleted',
  INTEGRATION_SYNCED = 'integration.synced',
  API_KEY_CREATED = 'api.key_created',
  API_KEY_DELETED = 'api.key_deleted',
  WEBHOOK_CREATED = 'webhook.created',
  WEBHOOK_DELETED = 'webhook.deleted',
  ACCESS_DENIED = 'security.access_denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  DATA_EXPORTED = 'gdpr.data_exported',
  DATA_DELETED = 'gdpr.data_deleted',
  CONSENT_GIVEN = 'gdpr.consent_given',
  CONSENT_WITHDRAWN = 'gdpr.consent_withdrawn',
}

export interface AuditLogEntry {
  id?: string;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  brandId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(log: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: log.eventType,
          resource: log.resourceType ?? log.action,
          userId: log.userId ?? null,
          organizationId: log.brandId ?? null,
          resourceId: log.resourceId ?? null,
          metadata: {
            ...(log.metadata || {}),
            ...(log.userEmail ? { userEmail: log.userEmail } : {}),
            ...(log.errorMessage ? { errorMessage: log.errorMessage } : {}),
          } as Prisma.InputJsonValue,
          ipAddress: log.ipAddress ?? null,
          userAgent: log.userAgent ?? null,
          success: log.success,
          error: log.errorMessage ?? null,
        },
      });

      const logLevel = log.success ? 'log' : 'warn';
      this.logger[logLevel](
        `Audit: ${log.eventType} by ${log.userEmail || log.userId} - ${log.action}`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create audit log: ${msg}`, stack);
    }
  }

  async logSuccess(
    eventType: AuditEventType,
    action: string,
    context: {
      userId?: string;
      userEmail?: string;
      brandId?: string;
      resourceType?: string;
      resourceId?: string;
      metadata?: Record<string, unknown>;
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
      metadata?: Record<string, unknown>;
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

  async search(filters: {
    userId?: string;
    organizationId?: string;
    eventType?: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: import('@prisma/client').AuditLog[]; total: number }> {
    try {
      const where: Prisma.AuditLogWhereInput = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.organizationId) where.organizationId = filters.organizationId;
      if (filters.eventType) where.action = filters.eventType;
      if (filters.resourceType) where.resource = filters.resourceType;
      if (filters.resourceId) where.resourceId = filters.resourceId;
      if (filters.success !== undefined) where.success = filters.success;

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
        if (filters.endDate) (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to search audit logs: ${msg}`);
      return { logs: [], total: 0 };
    }
  }

  async getResourceHistory(resourceType: string, resourceId: string): Promise<unknown[]> {
    try {
      return await this.prisma.auditLog.findMany({
        where: { resource: resourceType, resourceId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get resource history: ${msg}`);
      return [];
    }
  }

  async getUserActivity(userId: string, limit: number = 100): Promise<unknown[]> {
    try {
      return await this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get user activity: ${msg}`);
      return [];
    }
  }

  async getStats(organizationId?: string, days: number = 30): Promise<{
    period: { days: number; startDate: Date; endDate: Date };
    total: number;
    success: number;
    failures: number;
    successRate: number;
    topEvents: Array<{ eventType: string; count: number }>;
  } | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: Prisma.AuditLogWhereInput = {
        createdAt: { gte: startDate },
      };
      if (organizationId) where.organizationId = organizationId;

      const [total, success, failures, byAction] = await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.count({ where: { ...where, success: true } }),
        this.prisma.auditLog.count({ where: { ...where, success: false } }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: true,
          orderBy: { _count: { action: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        period: { days, startDate, endDate: new Date() },
        total,
        success,
        failures,
        successRate: total > 0 ? (success / total) * 100 : 0,
        topEvents: byAction.map((e) => ({
          eventType: e.action,
          count: typeof e._count === 'number' ? e._count : 0,
        })),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get audit stats: ${msg}`);
      return null;
    }
  }

  async exportToCSV(filters: Parameters<AuditLogsService['search']>[0]): Promise<string> {
    try {
      const { logs } = await this.search({ ...filters, limit: 10000 });

      let csv = 'Timestamp,Action,User,Organization,Resource,Success,IP,Error\n';

      for (const log of logs) {
        const timestamp = log.createdAt.toISOString();
        const action = log.action;
        const user = log.userId || 'N/A';
        const org = log.organizationId || 'N/A';
        const resource = log.resourceId ? `${log.resource}:${log.resourceId}` : 'N/A';
        const success = log.success ? 'Yes' : 'No';
        const ip = log.ipAddress || 'N/A';
        const errorVal = log.error || '';

        csv += `${timestamp},${action},${user},${org},${resource},${success},${ip},"${errorVal}"\n`;
      }

      return csv;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to export CSV: ${msg}`);
      throw error;
    }
  }

  async detectSuspiciousActivity(userId: string): Promise<Array<{ type: string; severity: string; message: string; count: number }>> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentFailures = await this.prisma.auditLog.findMany({
        where: {
          userId,
          success: false,
          createdAt: { gte: oneHourAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      const alerts: Array<{ type: string; severity: string; message: string; count: number }> = [];

      if (recentFailures.length > 5) {
        alerts.push({
          type: 'multiple_failures',
          severity: 'high',
          message: `${recentFailures.length} failed actions in the last hour`,
          count: recentFailures.length,
        });
      }

      const accessDenied = recentFailures.filter(
        (f) => f.action === AuditEventType.ACCESS_DENIED,
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to detect suspicious activity: ${msg}`);
      return [];
    }
  }
}
