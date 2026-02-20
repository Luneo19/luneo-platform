/**
 * SLOService (slo-sli.service) unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SLOService, SLOResult } from '../services/slo-sli.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('SLOService', () => {
  let service: SLOService;
  let _prisma: PrismaService;

  const mockPrisma = {
    monitoringMetric: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const origEnv = process.env.PROMETHEUS_URL;
    delete process.env.PROMETHEUS_URL;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SLOService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SLOService>(SLOService);
    prisma = module.get<PrismaService>(PrismaService);
    if (origEnv !== undefined) process.env.PROMETHEUS_URL = origEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateAllSLOs', () => {
    it('should return array of SLO results', async () => {
      mockPrisma.monitoringMetric.findMany.mockResolvedValue([]);

      const result = await service.evaluateAllSLOs();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((r: SLOResult) => {
        expect(r).toHaveProperty('service');
        expect(r).toHaveProperty('metric');
        expect(r).toHaveProperty('target');
        expect(r).toHaveProperty('current');
        expect(r).toHaveProperty('status');
        expect(['met', 'warning', 'breach']).toContain(r.status);
      });
    });
  });

  describe('getSLOStatus', () => {
    it('should return slos, current, compliant, lastUpdated', async () => {
      mockPrisma.monitoringMetric.findMany.mockResolvedValue([]);
      mockPrisma.monitoringMetric.findFirst.mockResolvedValue(null);

      const result = await service.getSLOStatus();

      expect(result).toHaveProperty('slos');
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('compliant');
      expect(result).toHaveProperty('lastUpdated');
      expect(typeof result.compliant).toBe('boolean');
      expect(Object.keys(result.slos).length).toBeGreaterThan(0);
    });
  });

  describe('getSLOHistory', () => {
    it('should return history from MonitoringMetric', async () => {
      const rows = [
        {
          service: 'api',
          metric: 'slo_latency',
          value: 150,
          timestamp: new Date(),
          unit: 'ms',
          labels: { target: 200, status: 'met', window: '24h' },
        },
      ];
      mockPrisma.monitoringMetric.findMany.mockResolvedValue(rows);

      const result = await service.getSLOHistory('api', 'latency', 7);

      expect(result).toHaveLength(1);
      expect(result[0].service).toBe('api');
      expect(result[0].metric).toBe('latency');
      expect(result[0].current).toBe(150);
      expect(mockPrisma.monitoringMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { service: 'api', metric: 'slo_latency', timestamp: expect.any(Object) },
        }),
      );
    });
  });

  describe('saveSLOResults', () => {
    it('should call createMany when results provided', async () => {
      mockPrisma.monitoringMetric.createMany.mockResolvedValue({ count: 2 });
      const results: SLOResult[] = [
        { service: 'api', metric: 'latency', target: 200, current: 150, status: 'met', window: '24h', timestamp: new Date() },
        { service: 'api', metric: 'error_rate', target: 0.5, current: 0.2, status: 'met', window: '24h', timestamp: new Date() },
      ];

      await service.saveSLOResults(results);

      expect(mockPrisma.monitoringMetric.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ service: 'api', metric: 'slo_latency', value: 150 }),
          ]),
        }),
      );
    });
  });
});
