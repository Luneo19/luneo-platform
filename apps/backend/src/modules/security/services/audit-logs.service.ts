import { Injectable, Logger } from '@nestjs/common';
import { AuditLog as PrismaAuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  AuditAlert,
  AuditContext,
  AuditEventType,
  AuditLogCreateInput,
  AuditLogRecord,
  AuditSearchQuery,
  AuditSearchResult,
  AuditStatistics,
  AuditMetadata,
} from '../interfaces/audit.interface';

export { AuditEventType } from '../interfaces/audit.interface';

/**
 * Service de gestion des logs d'audit
 * Traçabilité complète et immuable de toutes les actions
 */
@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : JSON.stringify(error);
  }

  private formatStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
  }

  private toJson(metadata?: AuditMetadata): Prisma.InputJsonValue | undefined {
    if (metadata === undefined) {
      return undefined;
    }
    return metadata as Prisma.InputJsonValue;
  }

  private mapRecord(record: PrismaAuditLog): AuditLogRecord {
    return {
      id: record.id,
      eventType: record.eventType as AuditEventType,
      userId: record.userId,
      userEmail: record.userEmail ?? null,
      brandId: record.brandId ?? null,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      action: record.action,
      success: record.success,
      metadata: (record.metadata as AuditMetadata | null) ?? null,
      timestamp: record.timestamp,
      ipAddress: record.ipAddress ?? null,
      userAgent: record.userAgent ?? null,
      errorMessage: record.errorMessage ?? null,
    };
  }

  private buildWhere(filters: AuditSearchQuery): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (typeof filters.success === 'boolean') {
      where.success = filters.success;
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

    return where;
  }

  /**
   * Créer un log d'audit
   */
  async log(entry: AuditLogCreateInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: entry.eventType,
          userId: entry.userId ?? 'system',
          userEmail: entry.userEmail,
          brandId: entry.brandId,
          resourceType: entry.resourceType ?? 'system',
          resourceId: entry.resourceId ?? 'unknown',
          action: entry.action,
          metadata: entry.metadata ? this.toJson(entry.metadata) : undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          success: entry.success,
          errorMessage: entry.errorMessage,
          timestamp: entry.timestamp ?? new Date(),
        },
      });

      // Log aussi dans les logs applicatifs pour debugging
      const logLevel: 'log' | 'warn' = entry.success ? 'log' : 'warn';
      this.logger[logLevel](
        `Audit: ${entry.eventType} by ${entry.userEmail || entry.userId || 'system'} - ${entry.action}`,
      );
    } catch (error) {
      // CRITICAL: Ne jamais faire échouer l'opération métier si l'audit échoue
      this.logger.error(
        `Failed to create audit log: ${this.formatError(error)}`,
        this.formatStack(error),
      );
    }
  }

  /**
   * Logger une action réussie
   */
  async logSuccess(
    eventType: AuditEventType,
    action: string,
    context: AuditContext,
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
    context: AuditContext,
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
  async search(filters: AuditSearchQuery): Promise<AuditSearchResult> {
    try {
      const where = this.buildWhere(filters);
      const limit = filters.limit ?? 100;
      const offset = filters.offset ?? 0;

      const [logs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map((log) => this.mapRecord(log)),
        total,
      };
    } catch (error) {
      this.logger.error(
        `Failed to search audit logs: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return { logs: [], total: 0 };
    }
  }

  /**
   * Récupérer l'historique d'une ressource
   */
  async getResourceHistory(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditLogRecord[]> {
    try {
      const records = await this.prisma.auditLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        orderBy: { timestamp: 'desc' },
      });
      return records.map((record) => this.mapRecord(record));
    } catch (error) {
      this.logger.error(
        `Failed to get resource history: ${this.formatError(error)}`,
        this.formatStack(error),
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
  ): Promise<AuditLogRecord[]> {
    try {
      const records = await this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return records.map((record) => this.mapRecord(record));
    } catch (error) {
      this.logger.error(
        `Failed to get user activity: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return [];
    }
  }

  /**
   * Statistiques d'audit
   */
  async getStats(brandId?: string, days: number = 30): Promise<AuditStatistics | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: Prisma.AuditLogWhereInput = {
        timestamp: { gte: startDate },
      };
      if (brandId) where.brandId = brandId;

      const [total, success, failures, byEventType] = await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.count({ where: { ...where, success: true } }),
        this.prisma.auditLog.count({ where: { ...where, success: false } }),
        this.prisma.auditLog.groupBy({
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
        topEvents: byEventType.map((event) => ({
          eventType: event.eventType as AuditEventType,
          count: typeof event._count === 'number' ? event._count : 0,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get audit stats: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return null;
    }
  }

  /**
   * Exporter des logs en CSV
   */
  async exportToCSV(filters: AuditSearchQuery): Promise<string> {
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
      this.logger.error(
        `Failed to export CSV: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Détecter des activités suspectes
   */
  async detectSuspiciousActivity(userId: string): Promise<AuditAlert[]> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Rechercher les échecs multiples
      const recentFailures = await this.prisma.auditLog.findMany({
        where: {
          userId,
          success: false,
          timestamp: { gte: oneHourAgo },
        },
        orderBy: { timestamp: 'desc' },
      });

      const alerts: AuditAlert[] = [];

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
        (failure) => failure.eventType === AuditEventType.ACCESS_DENIED,
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
        `Failed to detect suspicious activity: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return [];
    }
  }
}

