import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { ScorecardService } from './scorecard.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlywheelAutomationService {
  private readonly logger = new Logger(FlywheelAutomationService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly scorecardService: ScorecardService,
  ) {}

  @Cron('0 3 * * *')
  async runNightlyFlywheel(): Promise<void> {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      take: 200,
    });

    for (const org of organizations) {
      try {
        const to = new Date();
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const scorecard = await this.scorecardService.getUnifiedScorecard(org.id, { from, to });

        await this.prisma.analyticsEvent.create({
          data: {
            organizationId: org.id,
            eventType: 'flywheel_scorecard_snapshot',
            properties: {
              weightedScore: scorecard.totals.weightedScore,
              health: scorecard.totals.health,
              metrics: scorecard.metrics,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        // Keep flywheel org-scoped: record recommendation instead of mutating a global rollout.
        if (scorecard.totals.weightedScore >= 100) {
          await this.prisma.analyticsEvent.create({
            data: {
              organizationId: org.id,
              eventType: 'flywheel_rollout_recommendation',
              properties: {
                featureFlag: 'advanced_analytics',
                recommendedDeltaPct: 5,
                reason: 'organization_on_track',
              } as unknown as Prisma.InputJsonValue,
            },
          });
        }
      } catch (error) {
        this.logger.warn(
          `Flywheel run failed for org ${org.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

