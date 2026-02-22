/**
 * Heatmap Generator Service - Generate heatmap data per model and aggregate daily.
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface HeatmapData {
  viewAngleDistribution: Record<string, number>;
  scaleDistribution: Record<string, number>;
  placementHeatmap: unknown;
  interactionHotspots: unknown;
  date: string;
}

@Injectable()
export class HeatmapGeneratorService {
  private readonly logger = new Logger(HeatmapGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get heatmap data for a model in a period (from ARHeatmapData).
   */
  async getHeatmapData(
    projectId: string,
    modelId: string,
    brandId: string,
    period: { from: Date; to: Date },
  ): Promise<HeatmapData[]> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    const model = await this.prisma.aR3DModel.findFirst({
      where: { id: modelId, projectId },
    });
    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const rows = await this.prisma.aRHeatmapData.findMany({
      where: {
        projectId,
        modelId,
        date: { gte: period.from, lte: period.to },
      },
      orderBy: { date: 'asc' },
    });

    return rows.map((r) => ({
      viewAngleDistribution: (r.viewAngleDistribution as Record<string, number>) ?? {},
      scaleDistribution: (r.scaleDistribution as Record<string, number>) ?? {},
      placementHeatmap: r.placementHeatmap,
      interactionHotspots: r.interactionHotspots,
      date: r.date.toISOString().slice(0, 10),
    }));
  }

  /**
   * Aggregate daily heatmap data (job: compute from ARInteraction / ARSession and upsert ARHeatmapData).
   * Placeholder: creates empty aggregation; real impl would aggregate from ARInteraction.
   */
  async aggregateDaily(projectId: string, date: Date): Promise<void> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId },
    });
    if (!project) return;

    const models = await this.prisma.aR3DModel.findMany({
      where: { projectId },
      select: { id: true },
    });

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    for (const model of models) {
      await this.prisma.aRHeatmapData.upsert({
        where: {
          projectId_modelId_date: { projectId, modelId: model.id, date: dayStart },
        },
        create: {
          projectId,
          modelId: model.id,
          date: dayStart,
          viewAngleDistribution: {},
          scaleDistribution: {},
          placementHeatmap: {},
          interactionHotspots: {},
        },
        update: {
          viewAngleDistribution: {},
          scaleDistribution: {},
          placementHeatmap: {},
          interactionHotspots: {},
        },
      });
    }
    this.logger.debug(`Aggregated daily heatmap for project ${projectId} date=${dayStart.toISOString().slice(0, 10)}`);
  }
}
