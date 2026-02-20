/**
 * FeatureFlagsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from '../feature-flags.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let _prisma: PrismaService;

  const mockPrisma = {
    featureFlag: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFlagsForBrand', () => {
    it('should return global flags when brandId is null', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValue([
        { key: 'ai_studio', isEnabled: true, brandId: null },
        { key: 'custom_domain', isEnabled: false, brandId: null },
      ]);

      const result = await service.getFlagsForBrand(null);

      expect(result).toEqual({ ai_studio: true, custom_domain: false });
      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledWith({
        where: { isEnabled: true, OR: [{ brandId: null }] },
        select: { key: true, isEnabled: true, brandId: true },
      });
    });

    it('should return brand overrides when brandId provided', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValue([
        { key: 'ai_studio', isEnabled: true, brandId: null },
        { key: 'ai_studio', isEnabled: false, brandId: 'brand-1' },
      ]);

      const result = await service.getFlagsForBrand('brand-1');

      expect(result.ai_studio).toBe(false);
      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledWith({
        where: { isEnabled: true, OR: [{ brandId: null }, { brandId: 'brand-1' }] },
        select: { key: true, isEnabled: true, brandId: true },
      });
    });

    it('should return empty object when no flags', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValue([]);

      const result = await service.getFlagsForBrand('brand-1');

      expect(result).toEqual({});
    });
  });
});
