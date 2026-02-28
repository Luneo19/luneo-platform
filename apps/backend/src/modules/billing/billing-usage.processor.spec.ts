import { Test, TestingModule } from '@nestjs/testing';
import { BillingUsageProcessor } from './billing-usage.processor';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BillingService } from './billing.service';

describe('BillingUsageProcessor', () => {
  let processor: BillingUsageProcessor;

  const mockPrisma = {
    organization: {
      findMany: jest.fn(),
    },
    analyticsEvent: {
      create: jest.fn(),
    },
  };

  const mockBillingService = {
    syncSubscriptionStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingUsageProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    processor = module.get<BillingUsageProcessor>(BillingUsageProcessor);
    jest.clearAllMocks();
  });

  it('syncs organizations and writes snapshot event', async () => {
    mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org_1' }, { id: 'org_2' }]);
    mockBillingService.syncSubscriptionStatus
      .mockResolvedValueOnce({ synced: true, status: 'ACTIVE' })
      .mockResolvedValueOnce({ synced: false });
    mockPrisma.analyticsEvent.create.mockResolvedValue({ id: 'evt_1' });

    const result = await processor.syncBillingUsage({
      data: { maxOrganizations: 10 },
      timestamp: Date.now(),
    } as never);

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(1);
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalled();
  });
});
