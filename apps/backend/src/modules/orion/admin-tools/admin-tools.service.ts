import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

const DEFAULT_PAGE_SIZE = 20;

export interface GetAuditLogsOptions {
  page?: number;
  pageSize?: number;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetNotificationsOptions {
  page?: number;
  pageSize?: number;
  type?: string;
  read?: boolean;
}

export interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

@Injectable()
export class AdminToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(options: GetAuditLogsOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const where: {
      action?: string;
      adminId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (options.action) where.action = options.action;
    if (options.userId) where.adminId = options.userId;
    if (options.dateFrom || options.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = new Date(options.dateFrom);
      if (options.dateTo) {
        const to = new Date(options.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    const adminIds = [...new Set(logs.map((l) => l.adminId))];
    const users =
      adminIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: adminIds } },
            select: { id: true, email: true, firstName: true, lastName: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = logs.map((log) => ({
      ...log,
      user: userMap.get(log.adminId)
        ? {
            email: userMap.get(log.adminId)!.email,
            name: [userMap.get(log.adminId)!.firstName, userMap.get(log.adminId)!.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() || userMap.get(log.adminId)!.email,
          }
        : { email: log.adminId, name: log.adminId },
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getNotifications(options: GetNotificationsOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const where: { type?: string; read?: boolean } = {};
    if (options.type) where.type = options.type;
    if (typeof options.read === 'boolean') where.read = options.read;

    const [items, total] = await Promise.all([
      this.prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.adminNotification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async markNotificationRead(id: string) {
    const n = await this.prisma.adminNotification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    return this.prisma.adminNotification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead() {
    await this.prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true, readAt: new Date() },
    });
    return { success: true };
  }

  async getNotificationCount() {
    const count = await this.prisma.adminNotification.count({
      where: { read: false },
    });
    return { count };
  }

  async exportData(
    type: 'customers' | 'health-scores' | 'segments' | 'revenue' | 'audit-logs' | 'communications',
    format: 'csv' | 'json',
    filters: ExportFilters = {},
  ): Promise<string | object> {
    const limit = Math.min(10000, filters.limit ?? 5000);
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined;

    if (type === 'customers') {
      const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          where.createdAt.lte = to;
        }
      }
      const users = await this.prisma.user.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          brandId: true,
        },
      });
      const brands = await this.prisma.brand.findMany({
        where: { id: { in: users.map((u) => u.brandId).filter(Boolean) as string[] } },
        select: { id: true, subscriptionPlan: true, plan: true, name: true },
      });
      const brandMap = new Map(brands.map((b) => [b.id, b]));
      const rows = users.map((u) => ({
        id: u.id,
        email: u.email,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email,
        plan: u.brandId ? (brandMap.get(u.brandId)?.subscriptionPlan || brandMap.get(u.brandId)?.plan) ?? '' : '',
        signupDate: u.createdAt.toISOString(),
        lastActivity: u.lastLoginAt?.toISOString() ?? '',
      }));
      return format === 'csv' ? toCSV(rows) : { data: rows };
    }

    if (type === 'health-scores') {
      const scores = await this.prisma.customerHealthScore.findMany({
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
      const rows = scores.map((s) => ({
        userId: s.userId,
        userEmail: s.user.email,
        userName: [s.user.firstName, s.user.lastName].filter(Boolean).join(' ').trim() || s.user.email,
        healthScore: s.healthScore,
        churnRisk: s.churnRisk,
        engagementScore: s.engagementScore,
        lastActivityAt: s.lastActivityAt?.toISOString() ?? '',
      }));
      return format === 'csv' ? toCSV(rows) : { data: rows };
    }

    if (type === 'segments') {
      const segments = await this.prisma.analyticsSegment.findMany({
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });
      const rows = segments.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'analytics',
        userCount: s.userCount,
        conditions: JSON.stringify(s.criteria),
        isActive: s.isActive,
      }));
      return format === 'csv' ? toCSV(rows) : { data: rows };
    }

    if (type === 'revenue') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [revenueAgg, brands] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            paymentStatus: PaymentStatus.SUCCEEDED,
            deletedAt: null,
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { totalCents: true },
        }),
        this.prisma.brand.findMany({
          where: { stripeSubscriptionId: { not: null } },
          take: limit,
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            plan: true,
            planExpiresAt: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          },
        }),
      ]);
      const mrr = (revenueAgg._sum.totalCents ?? 0) / 100;
      const arr = mrr * 12;
      const rows = [
        { metric: 'MRR', value: mrr, unit: 'EUR' },
        { metric: 'ARR', value: arr, unit: 'EUR' },
        { metric: 'SubscribedBrands', value: brands.length },
        ...brands.map((b) => ({
          brandId: b.id,
          brandName: b.name,
          plan: b.subscriptionPlan || b.plan,
          planExpiresAt: b.planExpiresAt?.toISOString() ?? '',
        })),
      ];
      return format === 'csv' ? toCSV(rows) : { data: rows, mrr, arr, subscribedBrands: brands.length };
    }

    if (type === 'audit-logs') {
      const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          where.createdAt.lte = to;
        }
      }
      const logs = await this.prisma.adminAuditLog.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const rows = logs.map((l) => ({
        id: l.id,
        timestamp: l.createdAt.toISOString(),
        action: l.action,
        adminId: l.adminId,
        resource: l.resource,
        resourceId: l.resourceId ?? '',
        ipAddress: l.ipAddress ?? '',
      }));
      return format === 'csv' ? toCSV(rows) : { data: rows };
    }

    if (type === 'communications') {
      const campaigns = await this.prisma.emailCampaign.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          sentCount: true,
          openCount: true,
          clickCount: true,
          sentAt: true,
          status: true,
        },
      });
      const rows = campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        emailsSent: c.sentCount,
        openRate: c.sentCount > 0 ? ((c.openCount / c.sentCount) * 100).toFixed(2) + '%' : '0%',
        clickRate: c.sentCount > 0 ? ((c.clickCount / c.sentCount) * 100).toFixed(2) + '%' : '0%',
        sentAt: c.sentAt?.toISOString() ?? '',
        status: c.status,
      }));
      return format === 'csv' ? toCSV(rows) : { data: rows };
    }

    throw new NotFoundException(`Export type "${type}" not supported`);
  }
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (r: Record<string, unknown>) => headers.map((h) => escape(r[h])).join(',');
  return [headers.join(','), ...rows.map(line)].join('\n');
}
