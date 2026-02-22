import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PipelineStatus } from '@prisma/client';

/**
 * Periodic tasks for the PCE module:
 * - Detect stale pipelines
 * - Clean up resolved errors
 */
@Injectable()
export class PCESchedulerService {
  private readonly logger = new Logger(PCESchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async detectStalePipelines() {
    const staleThreshold = new Date(Date.now() - 24 * 3_600_000);

    const stalePipelines = await this.prisma.pipeline.findMany({
      where: {
        status: PipelineStatus.IN_PROGRESS,
        updatedAt: { lt: staleThreshold },
      },
      select: { id: true, orderId: true, currentStage: true, updatedAt: true },
    });

    if (stalePipelines.length > 0) {
      this.logger.warn(`Found ${stalePipelines.length} stale pipelines`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupResolvedErrors() {
    const threshold = new Date(Date.now() - 30 * 86_400_000);

    const { count } = await this.prisma.pipelineError.deleteMany({
      where: {
        resolvedAt: { not: null, lt: threshold },
      },
    });

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} resolved pipeline errors`);
    }
  }
}
