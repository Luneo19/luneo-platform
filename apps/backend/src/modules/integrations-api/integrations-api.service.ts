import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { QueuesService } from '@/libs/queues/queues.service';
import { JOB_TYPES } from '@/libs/queues/queues.constants';

@Injectable()
export class IntegrationsApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queuesService: QueuesService,
  ) {}

  async getOrganizationIntegrationsStatus(organizationId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        syncEnabled: true,
        autoSync: true,
        lastSyncAt: true,
        lastSyncSuccess: true,
        lastSyncError: true,
        updatedAt: true,
      },
    });

    const summary = integrations.reduce(
      (acc, integration) => {
        acc.total += 1;
        const status = String(integration.status).toLowerCase();
        acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
        return acc;
      },
      {
        total: 0,
        byStatus: {} as Record<string, number>,
      },
    );

    return {
      summary,
      integrations,
    };
  }

  async getOrganizationIntegrationsHealth(organizationId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        type: true,
        status: true,
        syncEnabled: true,
        autoSync: true,
        syncFrequency: true,
        lastSyncAt: true,
        lastSyncSuccess: true,
        lastSyncError: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const now = Date.now();
    const degraded = integrations.filter((integration) => {
      if (integration.status === 'ERROR' || integration.status === 'EXPIRED') {
        return true;
      }
      if (integration.syncEnabled && integration.lastSyncAt) {
        const ageMs = now - integration.lastSyncAt.getTime();
        return ageMs > 24 * 60 * 60 * 1000;
      }
      return false;
    });

    return {
      overallStatus: degraded.length > 0 ? 'degraded' : 'healthy',
      total: integrations.length,
      degradedCount: degraded.length,
      degraded,
    };
  }

  async triggerSync(
    organizationId: string,
    integrationType: string,
    userId: string,
  ) {
    const normalized = integrationType.toUpperCase().trim();
    const type = this.toIntegrationType(normalized);
    const integration = await this.prisma.integration.findFirst({
      where: {
        organizationId,
        type,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        syncEnabled: true,
      },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${normalized} not found`);
    }

    if (!integration.syncEnabled) {
      throw new BadRequestException(`Integration ${normalized} has sync disabled`);
    }

    const jobType = this.resolveSyncJobType(integration.type);
    const job = await this.queuesService.addIntegrationSyncJob(
      jobType,
      {
        organizationId,
        integrationId: integration.id,
        integrationType: integration.type,
        triggeredByUserId: userId,
      },
      {
        jobId: `integration-sync:${organizationId}:${integration.type}:${Date.now()}`,
      },
    );

    return {
      accepted: true,
      integrationId: integration.id,
      integrationType: integration.type,
      jobId: job.id,
      jobName: job.name,
    };
  }

  private toIntegrationType(value: string): IntegrationType {
    if (value in IntegrationType) {
      return value as IntegrationType;
    }
    throw new BadRequestException(`Unsupported integration type: ${value}`);
  }

  private resolveSyncJobType(type: IntegrationType) {
    switch (type) {
      case IntegrationType.SHOPIFY:
        return JOB_TYPES.INTEGRATION_SYNC.SYNC_SHOPIFY;
      case IntegrationType.WOOCOMMERCE:
        return JOB_TYPES.INTEGRATION_SYNC.SYNC_WOOCOMMERCE;
      case IntegrationType.PRESTASHOP:
        return JOB_TYPES.INTEGRATION_SYNC.SYNC_PRESTASHOP;
      default:
        return JOB_TYPES.INTEGRATION_SYNC.SYNC_WEBHOOK_INBOUND;
    }
  }
}
