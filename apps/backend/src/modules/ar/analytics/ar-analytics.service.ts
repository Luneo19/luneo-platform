/**
 * AR Analytics Service - Main analytics dashboard: KPIs, trends, top models, sessions, platform distribution.
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type Period = '7d' | '30d' | '90d';

export interface DashboardKPIs {
  totalSessions: number;
  totalQRScans: number;
  uniqueViewers: number;
  avgSessionDuration: number;
  topModels: { modelId: string; name: string; sessions: number }[];
  platformDistribution: { platform: string; count: number }[];
}

export interface SessionStats {
  total: number;
  byPlatform: { platform: string; count: number }[];
  avgDuration: number;
  withConversion: number;
}

@Injectable()
export class ArAnalyticsService {
  private readonly logger = new Logger(ArAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private parsePeriod(period: Period): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date(to);
    if (period === '7d') from.setDate(from.getDate() - 7);
    else if (period === '30d') from.setDate(from.getDate() - 30);
    else from.setDate(from.getDate() - 90);
    return { from, to };
  }

  /**
   * Get main dashboard for a brand (optional project filter).
   */
  async getDashboard(brandId: string, period: Period = '30d', projectId?: string): Promise<DashboardKPIs> {
    const { from, to } = this.parsePeriod(period);
    const _projectWhere = projectId ? { projectId } : { project: { brandId } };
    const brandWhere = projectId ? { project: { brandId, id: projectId } } : { project: { brandId } };

    const [sessions, qrScans, topModelsRaw, platformsRaw] = await Promise.all([
      this.prisma.aRSession.findMany({
        where: { ...brandWhere, startedAt: { gte: from, lte: to } },
        select: { id: true, duration: true },
      }),
      this.prisma.aRQRScan.findMany({
        where: {
          qrCode: { project: { brandId }, ...(projectId ? { projectId } : {}) },
          scannedAt: { gte: from, lte: to },
        },
        select: { id: true },
      }),
      this.prisma.aRSession.groupBy({
        by: ['modelId'],
        where: { ...brandWhere, startedAt: { gte: from, lte: to }, modelId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { modelId: 'desc' } },
        take: 10,
      }),
      this.prisma.aRSession.groupBy({
        by: ['platform'],
        where: { ...brandWhere, startedAt: { gte: from, lte: to } },
        _count: { id: true },
      }),
    ]);

    const totalDuration = sessions.reduce((s, x) => s + (x.duration ?? 0), 0);
    const modelIds = topModelsRaw.map((m) => m.modelId).filter(Boolean) as string[];
    const models = await this.prisma.aR3DModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, name: true },
    });
    const modelMap = new Map(models.map((m) => [m.id, m.name]));

    const topModels = topModelsRaw
      .filter((m) => m.modelId)
      .map((m) => ({
        modelId: m.modelId!,
        name: modelMap.get(m.modelId!) ?? 'Unknown',
        sessions: m._count.id,
      }));

    const platformDistribution = platformsRaw.map((p) => ({
      platform: p.platform,
      count: p._count.id,
    }));

    return {
      totalSessions: sessions.length,
      totalQRScans: qrScans.length,
      uniqueViewers: sessions.length,
      avgSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      topModels,
      platformDistribution,
    };
  }

  /**
   * Get session stats for a project.
   */
  async getSessionStats(projectId: string, brandId: string, period: Period = '30d'): Promise<SessionStats> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    const { from, to } = this.parsePeriod(period);
    const [sessions, byPlatform] = await Promise.all([
      this.prisma.aRSession.findMany({
        where: { projectId, startedAt: { gte: from, lte: to } },
        select: { id: true, duration: true, conversionAction: true },
      }),
      this.prisma.aRSession.groupBy({
        by: ['platform'],
        where: { projectId, startedAt: { gte: from, lte: to } },
        _count: { id: true },
      }),
    ]);

    const totalDuration = sessions.reduce((s, x) => s + (x.duration ?? 0), 0);
    const withConversion = sessions.filter((s) => s.conversionAction != null).length;

    return {
      total: sessions.length,
      byPlatform: byPlatform.map((p) => ({ platform: p.platform, count: p._count.id })),
      avgDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      withConversion,
    };
  }

  /**
   * Get platform distribution for a project.
   */
  async getPlatformDistribution(projectId: string, brandId: string, period: Period = '30d') {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }
    const { from, to } = this.parsePeriod(period);
    const result = await this.prisma.aRSession.groupBy({
      by: ['platform'],
      where: { projectId, startedAt: { gte: from, lte: to } },
      _count: { id: true },
    });
    return result.map((r) => ({ platform: r.platform, count: r._count.id }));
  }
}
