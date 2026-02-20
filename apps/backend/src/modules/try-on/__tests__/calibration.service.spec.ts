import { Test, TestingModule } from '@nestjs/testing';
import { CalibrationService } from '../services/calibration.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('CalibrationService', () => {
  let service: CalibrationService;
  let _prisma: Record<string, unknown>;

  const mockPrisma = {
    tryOnSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalibrationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CalibrationService>(CalibrationService);
    prisma = mockPrisma;
  });

  describe('saveCalibration', () => {
    const calibrationData = {
      deviceFingerprint: 'fp_abc123',
      deviceType: 'mobile' as const,
      cameraResolution: '1280x720',
      averageDistance: 45,
      pixelToRealRatio: 3.5,
      accuracyScore: 0.85,
    };

    it('should save calibration data for an existing session', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue({
        id: 'internal-uuid-1',
      });
      mockPrisma.tryOnSession.update.mockResolvedValue({
        id: 'internal-uuid-1',
        sessionId: 'ext-session-1',
        calibrationData,
      });

      const result = await service.saveCalibration(
        'ext-session-1',
        calibrationData,
      );

      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('ext-session-1');
      expect(mockPrisma.tryOnSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'ext-session-1' },
        select: { id: true },
      });
      expect(mockPrisma.tryOnSession.update).toHaveBeenCalledWith({
        where: { id: 'internal-uuid-1' },
        data: {
          calibrationData,
        },
        select: {
          id: true,
          sessionId: true,
          calibrationData: true,
        },
      });
    });

    it('should return null for a non-existent session', async () => {
      mockPrisma.tryOnSession.findUnique.mockResolvedValue(null);

      const result = await service.saveCalibration(
        'invalid-session',
        calibrationData,
      );

      expect(result).toBeNull();
      expect(mockPrisma.tryOnSession.update).not.toHaveBeenCalled();
    });

    it('should handle optional hand/face size fields', async () => {
      const dataWithExtras = {
        ...calibrationData,
        handSizeNormalized: 0.12,
        faceWidthNormalized: 0.15,
      };

      mockPrisma.tryOnSession.findUnique.mockResolvedValue({
        id: 'internal-uuid-1',
      });
      mockPrisma.tryOnSession.update.mockResolvedValue({
        id: 'internal-uuid-1',
        sessionId: 'ext-session-1',
        calibrationData: dataWithExtras,
      });

      const result = await service.saveCalibration(
        'ext-session-1',
        dataWithExtras,
      );

      expect(result).not.toBeNull();
      expect(mockPrisma.tryOnSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            calibrationData: dataWithExtras,
          }),
        }),
      );
    });
  });

  describe('getRecommendation', () => {
    it('should return mobile defaults when no historical data exists', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([]);

      const result = await service.getRecommendation('mobile');

      expect(result.qualityLevel).toBe('medium');
      expect(result.useAR).toBe(true);
      expect(result.scaleFactor).toBe(1.0);
      expect(result.positionOffset).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should return desktop defaults when no historical data exists', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([]);

      const result = await service.getRecommendation('desktop');

      expect(result.qualityLevel).toBe('high');
      expect(result.useAR).toBe(false);
      expect(result.scaleFactor).toBe(1.0);
    });

    it('should return tablet defaults (same as mobile)', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([]);

      const result = await service.getRecommendation('tablet');

      expect(result.qualityLevel).toBe('medium');
      expect(result.useAR).toBe(true);
    });

    it('should aggregate historical calibration data', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([
        {
          calibrationData: { pixelToRealRatio: 3.0 },
          performanceMetrics: { avgFps: 35 },
        },
        {
          calibrationData: { pixelToRealRatio: 4.0 },
          performanceMetrics: { avgFps: 40 },
        },
      ]);

      const result = await service.getRecommendation('desktop');

      // Average pixel ratio = (3.0 + 4.0) / 2 = 3.5
      // Scale factor = 1 / 3.5
      expect(result.scaleFactor).toBeCloseTo(1 / 3.5, 2);
    });

    it('should determine high quality from good avg FPS', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([
        {
          calibrationData: { pixelToRealRatio: 2.0 },
          performanceMetrics: { avgFps: 50 },
        },
        {
          calibrationData: { pixelToRealRatio: 2.5 },
          performanceMetrics: { avgFps: 55 },
        },
      ]);

      const result = await service.getRecommendation('desktop');

      // Note: The code initializes avgFps=30 and adds to it, then divides by perfCount
      // So: (30 + 50 + 55) / 2 = 67.5 → qualityLevel=high
      expect(result.qualityLevel).toBe('high');
    });

    it('should determine low quality from poor avg FPS', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([
        {
          calibrationData: { pixelToRealRatio: 2.0 },
          performanceMetrics: { avgFps: 10 },
        },
        {
          calibrationData: { pixelToRealRatio: 2.5 },
          performanceMetrics: { avgFps: 12 },
        },
      ]);

      const result = await service.getRecommendation('desktop');

      // avgFps = (10 + 12) / 2 = 11 → low (< 20)
      expect(result.qualityLevel).toBe('low');
    });

    it('should skip sessions without valid calibration data', async () => {
      mockPrisma.tryOnSession.findMany.mockResolvedValue([
        {
          calibrationData: { somethingElse: true },
          performanceMetrics: null,
        },
        {
          calibrationData: { pixelToRealRatio: 4.0 },
          performanceMetrics: { avgFps: 30 },
        },
      ]);

      const result = await service.getRecommendation('desktop');

      // Only 1 valid calibration entry (pixelToRealRatio=4.0)
      // Scale factor = 1/4.0 = 0.25
      expect(result.scaleFactor).toBeCloseTo(0.25, 2);
    });
  });
});
