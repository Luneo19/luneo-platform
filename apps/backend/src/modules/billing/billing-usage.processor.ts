import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BillingService } from './billing.service';

@Injectable()
@Processor(QUEUE_NAMES.ANALYTICS_AGGREGATION)
export class BillingUsageProcessor {
  private readonly logger = new Logger(BillingUsageProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  @Process(JOB_TYPES.ANALYTICS_AGGREGATION.SYNC_BILLING_USAGE)
  async syncBillingUsage(
    job: Job<{ organizationId?: string; maxOrganizations?: number }>,
  ) {
    const maxOrganizations = Math.min(
      Math.max(1, job.data.maxOrganizations ?? 300),
      1000,
    );

    const organizations = job.data.organizationId
      ? await this.prisma.organization.findMany({
          where: { id: job.data.organizationId, deletedAt: null },
          select: { id: true },
          take: 1,
        })
      : await this.prisma.organization.findMany({
          where: {
            deletedAt: null,
            stripeSubscriptionId: { not: null },
          },
          select: { id: true },
          take: maxOrganizations,
        });

    let synced = 0;
    let failed = 0;

    for (const org of organizations) {
      try {
        const result = await this.billingService.syncSubscriptionStatus(org.id);
        if (result.synced) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.warn(
          `Billing usage sync failed for org ${org.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    await this.prisma.analyticsEvent.create({
      data: {
        eventType: 'billing_usage_sync_snapshot',
        properties: {
          queuedAt: job.timestamp,
          processedAt: new Date().toISOString(),
          synced,
          failed,
          scope: job.data.organizationId ?? 'all',
        },
      },
    });

    return { synced, failed };
  }
}
