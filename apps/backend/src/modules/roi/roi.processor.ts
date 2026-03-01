import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PlatformRole, Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { RoiService } from './roi.service';

@Processor(QUEUE_NAMES.ANALYTICS_AGGREGATION)
export class RoiProcessor {
  private readonly logger = new Logger(RoiProcessor.name);

  constructor(
    private readonly roiService: RoiService,
    private readonly prisma: PrismaOptimizedService,
  ) {}

  @Process(JOB_TYPES.ANALYTICS_AGGREGATION.GENERATE_REPORT)
  async generateRoiReport(job: Job<{ organizationId?: string }>) {
    const organizations = job.data.organizationId
      ? await this.prisma.organization.findMany({
          where: { id: job.data.organizationId, status: 'ACTIVE', deletedAt: null },
          select: { id: true },
        })
      : await this.prisma.organization.findMany({
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
          take: 500,
        });

    let generated = 0;
    for (const org of organizations) {
      const report = await this.roiService.getOverview({
        id: 'system',
        email: 'system@luneo.local',
        role: PlatformRole.ADMIN,
        organizationId: org.id,
      });

      await this.prisma.analyticsEvent.create({
        data: {
          eventType: 'roi_snapshot',
          organizationId: org.id,
          properties: {
            ...report,
            generatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
      generated++;
    }

    this.logger.log(`ROI reports generated: ${generated}`);
    return { generated };
  }
}
