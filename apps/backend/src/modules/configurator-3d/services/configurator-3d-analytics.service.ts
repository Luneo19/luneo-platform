import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class Configurator3DAnalyticsService {
  private readonly logger = new Logger(Configurator3DAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard(brandId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalSessions, totalConfigs, savedCount, topConfigs] = await Promise.all([
      this.prisma.configurator3DSession.count({
        where: { configuration: { brandId }, startedAt: { gte: since } },
      }),
      this.prisma.configurator3DConfiguration.count({
        where: { brandId, deletedAt: null },
      }),
      this.prisma.configurator3DSession.count({
        where: { configuration: { brandId }, startedAt: { gte: since }, status: 'SAVED' },
      }),
      this.prisma.configurator3DSession.groupBy({
        by: ['configurationId'],
        where: { configuration: { brandId }, startedAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { configurationId: 'desc' } },
        take: 10,
      }),
    ]);

    const configIds = topConfigs.map((t) => t.configurationId);
    const configs = await this.prisma.configurator3DConfiguration.findMany({
      where: { id: { in: configIds } },
      select: { id: true, name: true },
    });
    const configMap = new Map(configs.map((c) => [c.id, c.name]));

    return {
      totalSessions,
      totalConfigurations: totalConfigs,
      savedConfigurations: savedCount,
      conversionRate: totalSessions > 0 ? (savedCount / totalSessions) * 100 : 0,
      topConfigurations: topConfigs.map((t) => ({
        configurationId: t.configurationId,
        name: configMap.get(t.configurationId) ?? 'Unknown',
        sessionCount: t._count.id,
      })),
      periodDays: days,
    };
  }

  async getSessions(brandId: string, configurationId?: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: { configuration: { brandId: string }; startedAt: { gte: Date }; configurationId?: string } = {
      configuration: { brandId },
      startedAt: { gte: since },
    };
    if (configurationId) where.configurationId = configurationId;

    const sessions = await this.prisma.configurator3DSession.findMany({
      where,
      select: {
        id: true,
        sessionId: true,
        status: true,
        startedAt: true,
        savedAt: true,
        completedAt: true,
        configuration: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    return { sessions, total: sessions.length };
  }

  async getOptionsHeatmap(configurationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const interactions = await this.prisma.configurator3DInteraction.findMany({
      where: {
        session: { configurationId, startedAt: { gte: since } },
        optionId: { not: null },
      },
      select: { optionId: true },
    });

    const counts = new Map<string, number>();
    for (const i of interactions) {
      if (i.optionId) {
        counts.set(i.optionId, (counts.get(i.optionId) ?? 0) + 1);
      }
    }

    const options = await this.prisma.configurator3DOption.findMany({
      where: { configurationId },
      select: { id: true, name: true, componentId: true },
    });

    return options.map((o) => ({
      optionId: o.id,
      optionName: o.name,
      componentId: o.componentId,
      selectionCount: counts.get(o.id) ?? 0,
    }));
  }

  async getFunnel(configurationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [started, withInteractions, saved, completed] = await Promise.all([
      this.prisma.configurator3DSession.count({
        where: { configurationId, startedAt: { gte: since } },
      }),
      this.prisma.configurator3DSession.count({
        where: {
          configurationId,
          startedAt: { gte: since },
          interactions: { some: {} },
        },
      }),
      this.prisma.configurator3DSession.count({
        where: { configurationId, startedAt: { gte: since }, status: 'SAVED' },
      }),
      this.prisma.configurator3DSession.count({
        where: { configurationId, startedAt: { gte: since }, status: 'COMPLETED' },
      }),
    ]);

    return {
      started,
      configured: withInteractions,
      saved,
      completed,
      saveRate: started > 0 ? (saved / started) * 100 : 0,
      completionRate: started > 0 ? (completed / started) * 100 : 0,
    };
  }

  async exportCSV(brandId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await this.prisma.configurator3DSession.findMany({
      where: { configuration: { brandId }, startedAt: { gte: since } },
      select: {
        id: true,
        sessionId: true,
        status: true,
        startedAt: true,
        savedAt: true,
        completedAt: true,
        configuration: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 1000,
    });

    const headers = ['Session ID', 'Configuration', 'Status', 'Started', 'Saved', 'Completed'];
    const rows = sessions.map((s) => [
      s.sessionId ?? s.id,
      s.configuration.name,
      s.status,
      s.startedAt?.toISOString() ?? '',
      s.savedAt?.toISOString() ?? '',
      s.completedAt?.toISOString() ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { csv, contentType: 'text/csv', filename: `configurator-analytics-${brandId}-${days}d.csv` };
  }
}
