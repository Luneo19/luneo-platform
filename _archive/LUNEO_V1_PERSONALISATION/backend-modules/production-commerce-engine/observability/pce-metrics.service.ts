import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineStatus } from '@prisma/client';
import type { AlertInfo } from '../interfaces/pce.interfaces';

@Injectable()
export class PCEMetricsService {
  private readonly logger = new Logger(PCEMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(brandId: string, period: string = 'day') {
    const periodStart = this.getPeriodStart(period);

    const [completed, failed, avgDuration, stageBreakdown] = await Promise.all([
      this.prisma.pipeline.count({
        where: {
          brandId,
          status: PipelineStatus.COMPLETED,
          completedAt: { gte: periodStart },
        },
      }),
      this.prisma.pipeline.count({
        where: {
          brandId,
          status: PipelineStatus.FAILED,
          failedAt: { gte: periodStart },
        },
      }),
      this.getAverageDuration(brandId, periodStart),
      this.getStageBreakdown(brandId),
    ]);

    return {
      period,
      periodStart,
      completed,
      failed,
      successRate: completed + failed > 0
        ? Math.round((completed / (completed + failed)) * 100)
        : 100,
      avgDurationMs: avgDuration,
      stageBreakdown,
    };
  }

  async getRecentAlerts(brandId: string, limit = 10): Promise<AlertInfo[]> {
    const errors = await this.prisma.pipelineError.findMany({
      where: {
        pipeline: { brandId },
        resolvedAt: null,
      },
      include: { pipeline: { select: { id: true, orderId: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return errors.map((err) => ({
      id: err.id,
      type: 'error' as const,
      message: err.error,
      stage: err.stage,
      pipelineId: err.pipeline.id,
      createdAt: err.createdAt,
    }));
  }

  private async getAverageDuration(brandId: string, since: Date): Promise<number> {
    const pipelines = await this.prisma.pipeline.findMany({
      where: {
        brandId,
        status: PipelineStatus.COMPLETED,
        completedAt: { gte: since },
        startedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true },
    });

    if (pipelines.length === 0) return 0;

    const totalMs = pipelines.reduce((sum, p) => {
      if (!p.startedAt || !p.completedAt) return sum;
      return sum + (p.completedAt.getTime() - p.startedAt.getTime());
    }, 0);

    return Math.round(totalMs / pipelines.length);
  }

  private async getStageBreakdown(brandId: string) {
    const pipelines = await this.prisma.pipeline.groupBy({
      by: ['currentStage'],
      where: { brandId, status: PipelineStatus.IN_PROGRESS },
      _count: true,
    });

    return pipelines.reduce(
      (acc, p) => {
        acc[p.currentStage] = p._count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'hour':
        return new Date(now.getTime() - 3_600_000);
      case 'day':
        now.setHours(0, 0, 0, 0);
        return now;
      case 'week':
        return new Date(now.getTime() - 7 * 86_400_000);
      case 'month':
        return new Date(now.getTime() - 30 * 86_400_000);
      default:
        now.setHours(0, 0, 0, 0);
        return now;
    }
  }
}
