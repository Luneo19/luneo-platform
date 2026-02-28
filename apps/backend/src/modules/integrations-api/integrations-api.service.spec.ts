import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationStatus, IntegrationType } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { QueuesService } from '@/libs/queues/queues.service';
import { IntegrationsApiService } from './integrations-api.service';

describe('IntegrationsApiService', () => {
  let service: IntegrationsApiService;

  const mockPrisma = {
    integration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockQueuesService = {
    addIntegrationSyncJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsApiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueuesService, useValue: mockQueuesService },
      ],
    }).compile();

    service = module.get<IntegrationsApiService>(IntegrationsApiService);
  });

  it('returns status summary and integrations list', async () => {
    mockPrisma.integration.findMany.mockResolvedValue([
      {
        id: 'i1',
        type: IntegrationType.SHOPIFY,
        status: IntegrationStatus.CONNECTED,
        syncEnabled: true,
      },
      {
        id: 'i2',
        type: IntegrationType.HUBSPOT,
        status: IntegrationStatus.ERROR,
        syncEnabled: true,
      },
    ]);

    const result = await service.getOrganizationIntegrationsStatus('org-1');
    expect(result.summary.total).toBe(2);
    expect(result.summary.byStatus.connected).toBe(1);
    expect(result.summary.byStatus.error).toBe(1);
    expect(result.integrations.length).toBe(2);
  });

  it('marks health as degraded when integration is stale', async () => {
    const staleDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    mockPrisma.integration.findMany.mockResolvedValue([
      {
        id: 'i1',
        type: IntegrationType.SHOPIFY,
        status: IntegrationStatus.CONNECTED,
        syncEnabled: true,
        autoSync: true,
        syncFrequency: 'daily',
        lastSyncAt: staleDate,
        lastSyncSuccess: true,
        lastSyncError: null,
      },
    ]);

    const result = await service.getOrganizationIntegrationsHealth('org-1');
    expect(result.overallStatus).toBe('degraded');
    expect(result.degradedCount).toBe(1);
  });

  it('queues sync job for supported integration types', async () => {
    mockPrisma.integration.findFirst.mockResolvedValue({
      id: 'i1',
      type: IntegrationType.SHOPIFY,
      syncEnabled: true,
    });
    mockQueuesService.addIntegrationSyncJob.mockResolvedValue({
      id: 'job-1',
      name: 'sync-shopify',
    });

    const result = await service.triggerSync('org-1', 'shopify', 'user-1');
    expect(result.accepted).toBe(true);
    expect(mockQueuesService.addIntegrationSyncJob).toHaveBeenCalled();
  });
});
