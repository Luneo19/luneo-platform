/**
 * Audit Log Service
 * Logs all important actions for compliance and security
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export enum AuditAction {
  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Product actions
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',

  // Design actions
  DESIGN_CREATED = 'DESIGN_CREATED',
  DESIGN_UPDATED = 'DESIGN_UPDATED',
  DESIGN_DELETED = 'DESIGN_DELETED',
  DESIGN_RENDERED = 'DESIGN_RENDERED',

  // Order actions
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',

  // Payment actions
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',

  // Admin actions
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  ADMIN_SETTINGS_CHANGED = 'ADMIN_SETTINGS_CHANGED',
  ADMIN_USER_MODIFIED = 'ADMIN_USER_MODIFIED',

  // Security actions
  SECURITY_EVENT = 'SECURITY_EVENT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AuditLogData {
  userId?: string;
  brandId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      if (!data.userId) {
        this.logger.warn('Audit log requires userId');
        return;
      }

      // Store in database using Prisma AuditLog model
      await this.prisma.auditLog.create({
        data: {
          eventType: data.action,
          userId: data.userId,
          resourceType: data.resourceType || 'unknown',
          resourceId: data.resourceId || 'unknown',
          action: data.action,
          success: data.success,
          metadata: {
            ...(data.metadata || {}),
            brandId: data.brandId,
            errorMessage: data.errorMessage,
          },
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        },
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`[AUDIT] ${data.action} - User: ${data.userId} - Success: ${data.success}`);
      }
    } catch (error) {
      this.logger.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    userId?: string;
    brandId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.resourceType) {
        where.resourceType = filters.resourceType;
      }

      if (filters.resourceId) {
        where.resourceId = filters.resourceId;
      }

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      // Filter by brandId from metadata if provided
      if (filters.brandId) {
        where.metadata = {
          path: ['brandId'],
          equals: filters.brandId,
        };
      }

      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      });

      return logs;
    } catch (error) {
      this.logger.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<any | null> {
    try {
      const log = await this.prisma.auditLog.findUnique({
        where: { id },
      });

      return log;
    } catch (error) {
      this.logger.error('Failed to get audit log by ID:', error);
      return null;
    }
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(
    filters: {
      userId?: string;
      brandId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    },
    format: 'csv' | 'json' = 'csv',
  ): Promise<Buffer> {
    try {
      const logs = await this.getAuditLogs({
        ...filters,
        limit: 10000, // Max export limit
      });

      if (format === 'json') {
        return Buffer.from(JSON.stringify(logs, null, 2), 'utf-8');
      }

      // CSV format
      const headers = ['ID', 'Event Type', 'User ID', 'Resource Type', 'Resource ID', 'Action', 'Success', 'IP Address', 'User Agent', 'Timestamp'];
      const rows = logs.map((log) => [
        log.id,
        log.eventType,
        log.userId,
        log.resourceType,
        log.resourceId,
        log.action,
        log.success ? 'Yes' : 'No',
        log.ipAddress || '',
        log.userAgent || '',
        log.timestamp.toISOString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return Buffer.from(csvContent, 'utf-8');
    } catch (error) {
      this.logger.error('Failed to export audit logs:', error);
      return Buffer.from('');
    }
  }
}
