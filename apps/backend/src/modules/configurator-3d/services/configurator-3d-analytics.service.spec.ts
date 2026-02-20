/**
 * Configurator3DAnalyticsService unit tests
 * Constructor: prisma
 * Methods: getDashboard, getSessions, getOptionsHeatmap, getFunnel, exportCSV
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Configurator3DAnalyticsService } from './configurator-3d-analytics.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('Configurator3DAnalyticsService', () => {
  let service: Configurator3DAnalyticsService;
  let _prisma: PrismaService;

  const brandId = 'brand-1';
  const configurationId = 'cfg-1';

  const mockPrisma = {
    configurator3DSession: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    configurator3DConfiguration: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    configurator3DInteraction: { findMany: jest.fn() },
    configurator3DOption: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<Configurator3DAnalyticsService>(Configurator3DAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return totalSessions, totalConfigurations, savedConfigurations, conversionRate', async () => {
      mockPrisma.configurator3DSession.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(5);
      mockPrisma.configurator3DSession.groupBy.mockResolvedValue([
        { configurationId: 'cfg1', _count: { id: 50 } },
        { configurationId: 'cfg2', _count: { id: 30 } },
      ]);
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([
        { id: 'cfg1', name: 'Config 1' },
        { id: 'cfg2', name: 'Config 2' },
      ]);

      const result = await service.getDashboard(brandId, 30);

      expect(result.totalSessions).toBe(100);
      expect(result.totalConfigurations).toBe(5);
      expect(result.savedConfigurations).toBe(30);
      expect(result.conversionRate).toBe(30);
      expect(result.topConfigurations).toHaveLength(2);
      expect(result.periodDays).toBe(30);
    });

    it('should use default 30 days when days not provided', async () => {
      mockPrisma.configurator3DSession.count.mockResolvedValue(0);
      mockPrisma.configurator3DConfiguration.count.mockResolvedValue(0);
      mockPrisma.configurator3DSession.groupBy.mockResolvedValue([]);
      mockPrisma.configurator3DConfiguration.findMany.mockResolvedValue([]);

      const result = await service.getDashboard(brandId);

      expect(result.periodDays).toBe(30);
    });
  });

  describe('getSessions', () => {
    it('should return sessions and total for brand', async () => {
      const sessions = [
        {
          id: 's1',
          sessionId: 'cfg3d_1',
          status: 'ACTIVE',
          startedAt: new Date(),
          configuration: { id: 'cfg1', name: 'C1' },
        },
      ];
      mockPrisma.configurator3DSession.findMany.mockResolvedValue(sessions);

      const result = await service.getSessions(brandId, undefined, 30);

      expect(result.sessions).toEqual(sessions);
      expect(result.total).toBe(1);
      expect(mockPrisma.configurator3DSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ configuration: { brandId } }),
          take: 100,
        }),
      );
    });

    it('should filter by configurationId when provided', async () => {
      mockPrisma.configurator3DSession.findMany.mockResolvedValue([]);

      await service.getSessions(brandId, configurationId, 30);

      expect(mockPrisma.configurator3DSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ configurationId }),
        }),
      );
    });
  });

  describe('getOptionsHeatmap', () => {
    it('should return selection counts per option', async () => {
      mockPrisma.configurator3DInteraction.findMany.mockResolvedValue([
        { optionId: 'opt1' },
        { optionId: 'opt1' },
        { optionId: 'opt2' },
      ]);
      mockPrisma.configurator3DOption.findMany.mockResolvedValue([
        { id: 'opt1', name: 'Black', componentId: 'comp1' },
        { id: 'opt2', name: 'White', componentId: 'comp1' },
      ]);

      const result = await service.getOptionsHeatmap(configurationId, 30);

      expect(result).toHaveLength(2);
      const opt1 = result.find((r) => r.optionId === 'opt1');
      const opt2 = result.find((r) => r.optionId === 'opt2');
      expect(opt1?.selectionCount).toBe(2);
      expect(opt2?.selectionCount).toBe(1);
    });
  });

  describe('getFunnel', () => {
    it('should return started, configured, saved, completed and rates', async () => {
      mockPrisma.configurator3DSession.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(10);

      const result = await service.getFunnel(configurationId, 30);

      expect(result.started).toBe(100);
      expect(result.configured).toBe(80);
      expect(result.saved).toBe(25);
      expect(result.completed).toBe(10);
      expect(result.saveRate).toBe(25);
      expect(result.completionRate).toBe(10);
    });

    it('should return zero rates when started is 0', async () => {
      mockPrisma.configurator3DSession.count.mockResolvedValue(0);

      const result = await service.getFunnel(configurationId, 30);

      expect(result.saveRate).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe('exportCSV', () => {
    it('should return csv string, contentType, and filename', async () => {
      mockPrisma.configurator3DSession.findMany.mockResolvedValue([
        {
          id: 's1',
          sessionId: 'cfg3d_abc',
          status: 'SAVED',
          startedAt: new Date('2024-01-01'),
          savedAt: new Date('2024-01-01'),
          completedAt: null,
          configuration: { name: 'Config 1' },
        },
      ]);

      const result = await service.exportCSV(brandId, 30);

      expect(result.csv).toContain('Session ID');
      expect(result.csv).toContain('Configuration');
      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toContain(brandId);
      expect(result.filename).toContain('30d');
    });
  });
});
