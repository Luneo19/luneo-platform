import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PerformanceService } from '../services/performance.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      tryOnSession: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tryOnPerformanceMetric: {
        create: jest.fn(),
        createMany: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    prisma = module.get(PrismaService);
  });

  describe('recordMetric', () => {
    it('should record a single performance metric', async () => {
      (prisma.tryOnSession.findUnique as jest.Mock).mockResolvedValue({ id: 'internal-1' });
      (prisma.tryOnPerformanceMetric.create as jest.Mock).mockResolvedValue({
        id: 'metric-1',
        fps: 30,
        detectionLatencyMs: 25,
        renderLatencyMs: 12,
        createdAt: new Date(),
      });

      const result = await service.recordMetric('session-ext-1', {
        fps: 30,
        detectionLatencyMs: 25,
        renderLatencyMs: 12,
        deviceType: 'desktop',
      });

      expect(result.fps).toBe(30);
      expect(prisma.tryOnPerformanceMetric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'internal-1',
            fps: 30,
            detectionLatencyMs: 25,
            renderLatencyMs: 12,
            deviceType: 'desktop',
          }),
        }),
      );
    });

    it('should throw NotFoundException for invalid session', async () => {
      (prisma.tryOnSession.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recordMetric('invalid-session', {
          fps: 30,
          detectionLatencyMs: 25,
          renderLatencyMs: 12,
          deviceType: 'desktop',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordSessionSummary', () => {
    it('should aggregate and store batch metrics', async () => {
      (prisma.tryOnSession.findUnique as jest.Mock).mockResolvedValue({ id: 'internal-1' });
      (prisma.tryOnPerformanceMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.tryOnSession.update as jest.Mock).mockResolvedValue({});

      const metrics = [
        { fps: 30, detectionLatencyMs: 20, renderLatencyMs: 10, deviceType: 'desktop' },
        { fps: 28, detectionLatencyMs: 25, renderLatencyMs: 12, deviceType: 'desktop' },
        { fps: 32, detectionLatencyMs: 22, renderLatencyMs: 8, deviceType: 'desktop' },
      ];

      const result = await service.recordSessionSummary('session-ext-1', metrics);

      expect(result.avgFps).toBe(30); // (30+28+32)/3 = 30
      expect(result.avgDetectionLatency).toBe(22); // (20+25+22)/3 ≈ 22
      expect(result.avgRenderLatency).toBe(10); // (10+12+8)/3 = 10
      expect(result.sampleCount).toBe(3);
    });
  });

  describe('checkDeviceCompatibility', () => {
    it('should return compatibility info from historical data', async () => {
      (prisma.tryOnPerformanceMetric.aggregate as jest.Mock).mockResolvedValue({
        _avg: { fps: 35, detectionLatencyMs: 20, renderLatencyMs: 10 },
        _count: { id: 50 },
      });

      const result = await service.checkDeviceCompatibility('desktop');
      expect(result.supported).toBe(true);
      expect(result.recommendedQuality).toBe('high');
      expect(result.avgFps).toBe(35);
    });

    it('should assume supported when no historical data', async () => {
      (prisma.tryOnPerformanceMetric.aggregate as jest.Mock).mockResolvedValue({
        _avg: { fps: null, detectionLatencyMs: null, renderLatencyMs: null },
        _count: { id: 0 },
      });

      const result = await service.checkDeviceCompatibility('mobile');
      expect(result.supported).toBe(true);
      expect(result.recommendedMode).toBe('3d_full');
    });
  });
});
