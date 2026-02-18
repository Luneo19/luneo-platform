/**
 * AR Studio - Analytics Aggregation Worker
 * BullMQ worker for daily aggregation of AR analytics (funnels, heatmaps)
 */

import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface AggregationJobData {
  projectId?: string; // null = all projects
  date?: string; // ISO date, default = yesterday
}

@Processor('ar-analytics')
export class AnalyticsAggregationWorker {
  private readonly logger = new Logger(AnalyticsAggregationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('aggregate-daily')
  async handleDailyAggregation(job: Job<AggregationJobData>): Promise<void> {
    const dateStr = job.data.date || this.getYesterdayDate();
    const date = new Date(dateStr);

    this.logger.log(`Running daily AR analytics aggregation for ${dateStr}`);

    try {
      // Get all projects (or specific one)
      const projects = job.data.projectId
        ? [{ id: job.data.projectId }]
        : await this.prisma.aRProject.findMany({ select: { id: true } });

      for (const project of projects) {
        await this.aggregateProjectFunnel(project.id, date);
        await this.aggregateProjectHeatmaps(project.id, date);
      }

      this.logger.log(`Daily aggregation complete for ${projects.length} projects`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Aggregation failed: ${errorMsg}`);
      throw error;
    }
  }

  private async aggregateProjectFunnel(projectId: string, date: Date): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Count sessions and interactions for the day
    const sessions = await this.prisma.aRSession.findMany({
      where: {
        projectId,
        startedAt: { gte: dayStart, lte: dayEnd },
      },
      select: {
        duration: true,
        placementCount: true,
        screenshotsTaken: true,
        shareCount: true,
        conversionAction: true,
        conversionValue: true,
      },
    });

    // Count QR scans
    const qrScans = await this.prisma.aRQRScan.count({
      where: {
        qrCode: { projectId },
        scannedAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const engagedSessions = sessions.filter((s) => (s.duration || 0) > 30).length;
    const screenshots = sessions.reduce((sum, s) => sum + s.screenshotsTaken, 0);
    const shares = sessions.reduce((sum, s) => sum + s.shareCount, 0);
    const addToCarts = sessions.filter((s) => s.conversionAction === 'add_to_cart').length;
    const purchases = sessions.filter((s) => s.conversionAction === 'purchase').length;
    const totalRevenue = sessions
      .filter((s) => s.conversionAction === 'purchase')
      .reduce((sum, s) => sum + (s.conversionValue || 0), 0);
    const modelPlacements = sessions.reduce((sum, s) => sum + s.placementCount, 0);

    await this.prisma.aRConversionFunnel.upsert({
      where: { projectId_date: { projectId, date: dayStart } },
      update: {
        qrScans,
        arLaunches: sessions.length,
        modelPlacements,
        engagedSessions,
        screenshots,
        shares,
        addToCarts,
        purchases,
        totalRevenue,
        avgOrderValue: purchases > 0 ? totalRevenue / purchases : 0,
      },
      create: {
        projectId,
        date: dayStart,
        qrScans,
        arLaunches: sessions.length,
        modelPlacements,
        engagedSessions,
        screenshots,
        shares,
        addToCarts,
        purchases,
        totalRevenue,
        avgOrderValue: purchases > 0 ? totalRevenue / purchases : 0,
      },
    });
  }

  private async aggregateProjectHeatmaps(projectId: string, date: Date): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Get unique model IDs from sessions
    const modelSessions = await this.prisma.aRSession.findMany({
      where: {
        projectId,
        modelId: { not: null },
        startedAt: { gte: dayStart, lte: dayEnd },
      },
      select: { modelId: true },
      distinct: ['modelId'],
    });

    for (const { modelId } of modelSessions) {
      if (!modelId) continue;

      // Get interactions for this model
      const interactions = await this.prisma.aRInteraction.findMany({
        where: {
          session: { projectId, modelId },
          timestamp: { gte: dayStart, lte: dayEnd },
        },
        select: { type: true, position: true, rotation: true, scale: true },
      });

      // Aggregate interaction data
      const viewAngles: number[] = [];
      const scales: number[] = [];
      const positions: Array<{ x: number; y: number; z: number }> = [];

      for (const interaction of interactions) {
        if (interaction.rotation) {
          const rot = interaction.rotation as { x?: number; y?: number };
          if (rot.y !== undefined) viewAngles.push(rot.y);
        }
        if (interaction.scale) {
          scales.push(interaction.scale);
        }
        if (interaction.position) {
          positions.push(interaction.position as { x: number; y: number; z: number });
        }
      }

      await this.prisma.aRHeatmapData.upsert({
        where: { projectId_modelId_date: { projectId, modelId, date: dayStart } },
        update: {
          viewAngleDistribution: this.buildDistribution(viewAngles, 36, 0, 360),
          scaleDistribution: this.buildDistribution(scales, 20, 0.1, 5),
          placementHeatmap: this.buildPositionHeatmap(positions),
          interactionHotspots: { total: interactions.length },
        },
        create: {
          projectId,
          modelId,
          date: dayStart,
          viewAngleDistribution: this.buildDistribution(viewAngles, 36, 0, 360),
          scaleDistribution: this.buildDistribution(scales, 20, 0.1, 5),
          placementHeatmap: this.buildPositionHeatmap(positions),
          interactionHotspots: { total: interactions.length },
        },
      });
    }
  }

  private buildDistribution(values: number[], buckets: number, min: number, max: number): Record<string, number> {
    const dist: Record<string, number> = {};
    const step = (max - min) / buckets;

    for (let i = 0; i < buckets; i++) {
      dist[`${(min + i * step).toFixed(1)}`] = 0;
    }

    for (const v of values) {
      const bucketIdx = Math.min(Math.floor((v - min) / step), buckets - 1);
      const key = `${(min + bucketIdx * step).toFixed(1)}`;
      dist[key] = (dist[key] || 0) + 1;
    }

    return dist;
  }

  private buildPositionHeatmap(
    positions: Array<{ x: number; y: number; z: number }>,
  ): Record<string, number> {
    const grid: Record<string, number> = {};
    const gridSize = 0.5; // 50cm grid cells

    for (const pos of positions) {
      const key = `${Math.round(pos.x / gridSize)},${Math.round(pos.z / gridSize)}`;
      grid[key] = (grid[key] || 0) + 1;
    }

    return grid;
  }

  private getYesterdayDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Analytics aggregation job ${job.id} failed: ${error.message}`);
  }
}
