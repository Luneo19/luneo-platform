import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ArAnalyticsService } from '../analytics/ar-analytics.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  createMockPrismaService,
  createSampleModel,
  createSampleProject,
  type ARPrismaMock,
} from './test-helpers';

describe('ArAnalyticsService', () => {
  let service: ArAnalyticsService;
  let prisma: ARPrismaMock;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArAnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ArAnalyticsService>(ArAnalyticsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dashboard data structure', async () => {
    const sessions = [
      { id: 's1', duration: 30000 },
      { id: 's2', duration: 45000 },
    ];
    prisma.aRSession.findMany.mockResolvedValue(sessions);
    prisma.aRQRScan.findMany.mockResolvedValue([{ id: 'scan1' }]);
    prisma.aRSession.groupBy
      .mockResolvedValueOnce([{ modelId: 'model-1', _count: { id: 5 } }])
      .mockResolvedValueOnce([{ platform: 'ios', _count: { id: 3 } }, { platform: 'android', _count: { id: 2 } }]);
    prisma.aR3DModel.findMany.mockResolvedValue([
      createSampleModel({ id: 'model-1', name: 'Top Model' }),
    ]);

    const result = await service.getDashboard('brand-1', '30d');

    expect(result).toMatchObject({
      totalSessions: 2,
      totalQRScans: 1,
      avgSessionDuration: 37500,
      topModels: expect.any(Array),
      platformDistribution: expect.any(Array),
    });
    expect(result.uniqueViewers).toBe(2);
    expect(result.platformDistribution.length).toBe(2);
  });

  it('should calculate session stats correctly', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(createSampleProject({ id: 'proj-1', brandId: 'brand-1' }));
    prisma.aRSession.findMany.mockResolvedValue([
      { id: 's1', duration: 20000, conversionAction: 'add_to_cart' },
      { id: 's2', duration: 40000, conversionAction: null },
    ]);
    prisma.aRSession.groupBy.mockResolvedValue([
      { platform: 'ios', _count: { id: 1 } },
      { platform: 'android', _count: { id: 1 } },
    ]);

    const result = await service.getSessionStats('proj-1', 'brand-1', '7d');

    expect(result.total).toBe(2);
    expect(result.avgDuration).toBe(30000);
    expect(result.withConversion).toBe(1);
    expect(result.byPlatform).toHaveLength(2);
  });

  it('should calculate platform distribution', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(createSampleProject({ id: 'proj-1', brandId: 'brand-1' }));
    prisma.aRSession.groupBy.mockResolvedValue([
      { platform: 'ios', _count: { id: 10 } },
      { platform: 'android', _count: { id: 5 } },
      { platform: 'desktop', _count: { id: 2 } },
    ]);

    const result = await service.getPlatformDistribution('proj-1', 'brand-1', '30d');

    expect(result).toEqual([
      { platform: 'ios', count: 10 },
      { platform: 'android', count: 5 },
      { platform: 'desktop', count: 2 },
    ]);
  });

  it('should throw ForbiddenException when project not found for session stats', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(null);
    await expect(service.getSessionStats('proj-1', 'brand-1')).rejects.toThrow(ForbiddenException);
    await expect(service.getSessionStats('proj-1', 'brand-1')).rejects.toThrow(/Project not found|access denied/i);
  });

  it('should throw ForbiddenException when project not found for platform distribution', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(null);
    await expect(service.getPlatformDistribution('proj-1', 'brand-1')).rejects.toThrow(ForbiddenException);
  });

  it('should return zero averages when no sessions', async () => {
    prisma.aRSession.findMany.mockResolvedValue([]);
    prisma.aRQRScan.findMany.mockResolvedValue([]);
    prisma.aRSession.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.aR3DModel.findMany.mockResolvedValue([]);

    const result = await service.getDashboard('brand-1', '7d');

    expect(result.totalSessions).toBe(0);
    expect(result.avgSessionDuration).toBe(0);
    expect(result.topModels).toEqual([]);
  });
});
