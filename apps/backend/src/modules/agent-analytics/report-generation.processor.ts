import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { ScorecardService } from './scorecard.service';

@Injectable()
@Processor(QUEUE_NAMES.ANALYTICS_AGGREGATION)
export class ReportGenerationProcessor {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly scorecardService: ScorecardService,
  ) {}

  @Process(JOB_TYPES.ANALYTICS_AGGREGATION.GENERATE_SCORECARD_REPORT)
  async generateScorecardReport(
    job: Job<{ organizationId?: string; daysWindow?: number; maxOrganizations?: number }>,
  ) {
    const daysWindow = Math.min(Math.max(7, job.data.daysWindow ?? 30), 180);
    const maxOrganizations = Math.min(Math.max(1, job.data.maxOrganizations ?? 250), 1000);

    const organizations = job.data.organizationId
      ? await this.prisma.organization.findMany({
          where: { id: job.data.organizationId, status: 'ACTIVE', deletedAt: null },
          select: { id: true },
          take: 1,
        })
      : await this.prisma.organization.findMany({
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
          take: maxOrganizations,
        });

    const to = new Date();
    const from = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);

    let generated = 0;
    let failed = 0;

    for (const org of organizations) {
      try {
        const scorecard = await this.scorecardService.getUnifiedScorecard(org.id, { from, to });
        await this.prisma.analyticsEvent.create({
          data: {
            organizationId: org.id,
            eventType: 'scorecard_report_generated',
            properties: {
              period: scorecard.period,
              totals: scorecard.totals,
              metrics: scorecard.metrics,
            } as unknown as Prisma.InputJsonValue,
          },
        });
        generated++;
      } catch (error) {
        failed++;
        this.logger.warn(
          `Scorecard report failed for org ${org.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return { generated, failed };
  }
}
