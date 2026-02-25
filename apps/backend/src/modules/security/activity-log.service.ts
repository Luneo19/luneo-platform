import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { AuditLog, Prisma } from '@prisma/client';

export interface ActivityLogEntry {
  userId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  error?: string;
}

export interface ActivityLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedActivityLog {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logActivity(
    userId: string,
    organizationId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>,
    request?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action,
          resource: resourceType,
          resourceId: resourceId ?? null,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
          ipAddress: request?.ip ?? null,
          userAgent:
            (request?.headers?.['user-agent'] as string | undefined) ?? null,
          success: true,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to log activity: ${msg}`);
    }
  }

  async logActivityFromEntry(entry: ActivityLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          organizationId: entry.organizationId,
          action: entry.action,
          resource: entry.resourceType,
          resourceId: entry.resourceId ?? null,
          metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          success: entry.success ?? true,
          error: entry.error ?? null,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to log activity entry: ${msg}`);
    }
  }

  async getActivityLog(
    organizationId: string,
    filters: ActivityLogFilters = {},
    page = 1,
    limit = 50,
  ): Promise<PaginatedActivityLog> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const skip = (safePage - 1) * safeLimit;

    const where = this.buildWhereClause(organizationId, filters);

    try {
      const [items, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: safeLimit,
          skip,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch activity log: ${msg}`);
      return { items: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 };
    }
  }

  async getMemberActivity(
    organizationId: string,
    userId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    try {
      return await this.prisma.auditLog.findMany({
        where: { organizationId, userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch member activity: ${msg}`);
      return [];
    }
  }

  async getRecentActivitySummary(
    organizationId: string,
    hours = 24,
  ): Promise<{
    total: number;
    byAction: Array<{ action: string; count: number }>;
    byUser: Array<{ userId: string; count: number }>;
    byResource: Array<{ resource: string; count: number }>;
  }> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      createdAt: { gte: since },
    };

    try {
      const [total, byAction, byUser, byResource] = await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: true,
          orderBy: { _count: { action: 'desc' } },
          take: 10,
        }),
        this.prisma.auditLog.groupBy({
          by: ['userId'],
          where: { ...where, userId: { not: null } },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),
        this.prisma.auditLog.groupBy({
          by: ['resource'],
          where,
          _count: true,
          orderBy: { _count: { resource: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        total,
        byAction: byAction.map((r) => ({
          action: r.action,
          count: typeof r._count === 'number' ? r._count : 0,
        })),
        byUser: byUser.map((r) => ({
          userId: r.userId!,
          count: typeof r._count === 'number' ? r._count : 0,
        })),
        byResource: byResource.map((r) => ({
          resource: r.resource,
          count: typeof r._count === 'number' ? r._count : 0,
        })),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch activity summary: ${msg}`);
      return { total: 0, byAction: [], byUser: [], byResource: [] };
    }
  }

  private buildWhereClause(
    organizationId: string,
    filters: ActivityLogFilters,
  ): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = { organizationId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resource = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.success !== undefined) where.success = filters.success;

    if (filters.startDate || filters.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.startDate) dateFilter.gte = filters.startDate;
      if (filters.endDate) dateFilter.lte = filters.endDate;
      where.createdAt = dateFilter;
    }

    return where;
  }
}
