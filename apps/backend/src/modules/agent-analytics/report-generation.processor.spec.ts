import { Test, TestingModule } from '@nestjs/testing';
import { ReportGenerationProcessor } from './report-generation.processor';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { ScorecardService } from './scorecard.service';

describe('ReportGenerationProcessor', () => {
  let processor: ReportGenerationProcessor;

  const mockPrisma = {
    organization: {
      findMany: jest.fn(),
    },
    analyticsEvent: {
      create: jest.fn(),
    },
  };

  const mockScorecardService = {
    getUnifiedScorecard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportGenerationProcessor,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: ScorecardService, useValue: mockScorecardService },
      ],
    }).compile();

    processor = module.get<ReportGenerationProcessor>(ReportGenerationProcessor);
    jest.clearAllMocks();
  });

  it('generates scorecard report events for active orgs', async () => {
    mockPrisma.organization.findMany.mockResolvedValue([{ id: 'org_1' }]);
    mockScorecardService.getUnifiedScorecard.mockResolvedValue({
      period: { from: '2026-01-01', to: '2026-01-31', quarter: 'Q1' },
      totals: { weightedScore: 92, health: 'on_track' },
      metrics: [],
    });
    mockPrisma.analyticsEvent.create.mockResolvedValue({ id: 'evt_1' });

    const result = await processor.generateScorecardReport({
      data: { daysWindow: 30 },
    } as never);

    expect(result.generated).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalled();
  });
});
