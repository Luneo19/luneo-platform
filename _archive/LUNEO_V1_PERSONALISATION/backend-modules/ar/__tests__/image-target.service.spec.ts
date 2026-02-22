import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImageTargetService } from '../tracking/image-target.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { TargetQualityAnalyzerService } from '../tracking/target-quality-analyzer.service';
import { FeatureExtractorService } from '../tracking/feature-extractor.service';
import { TargetManagerService } from '../tracking/target-manager.service';
import { createMockPrismaService, createMockStorageService, type ARPrismaMock } from './test-helpers';
import { TriggerAction } from '@prisma/client';

describe('ImageTargetService', () => {
  let service: ImageTargetService;
  let prisma: ARPrismaMock;
  let storage: ReturnType<typeof createMockStorageService>;
  let qualityAnalyzer: { analyzeQuality: jest.Mock };
  let featureExtractor: { extractFeatures: jest.Mock };
  let targetManager: { assertProjectAccess: jest.Mock; getTargetById: jest.Mock; listTargets: jest.Mock };

  const sampleTarget = {
    id: 'target-1',
    projectId: 'proj-1',
    name: 'Poster',
    imageURL: 'https://cdn.example.com/target.png',
    thumbnailURL: 'https://cdn.example.com/target-thumb.png',
    physicalWidth: 30,
    physicalHeight: 20,
    linkedModelId: 'model-1',
    linkedModel: { id: 'model-1', name: 'Model' },
    trackingQuality: 'GOOD',
    qualityScore: 0.85,
    qualityIssues: [],
    recommendations: [],
    triggerAction: TriggerAction.SHOW_3D_MODEL,
    isActive: true,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    storage = createMockStorageService();
    qualityAnalyzer = { analyzeQuality: jest.fn().mockResolvedValue({
      trackingQuality: 'GOOD',
      score: 0.85,
      qualityIssues: [],
      recommendations: ['Use higher contrast'],
    }) };
    featureExtractor = { extractFeatures: jest.fn().mockResolvedValue({ featurePointCount: 150 }) };
    targetManager = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
      getTargetById: jest.fn(),
      listTargets: jest.fn().mockResolvedValue({ targets: [], pagination: { total: 0, limit: 50, offset: 0, totalPages: 0 } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageTargetService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: TargetQualityAnalyzerService, useValue: qualityAnalyzer },
        { provide: FeatureExtractorService, useValue: featureExtractor },
        { provide: TargetManagerService, useValue: targetManager },
      ],
    }).compile();
    service = module.get<ImageTargetService>(ImageTargetService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create image targets', async () => {
    const buffer = Buffer.alloc(1000);
    storage.uploadBuffer.mockResolvedValue('https://cdn.example.com/ar-studio/targets/proj-1/1-image.png');
    prisma.aRImageTarget.create.mockResolvedValue(sampleTarget);

    const result = await service.createTarget(
      'proj-1',
      'brand-1',
      { buffer, originalname: 'image.png', mimetype: 'image/png' },
      { name: 'Poster', physicalWidthCm: 30, physicalHeightCm: 20, linkedModelId: 'model-1' },
    );

    expect(result.id).toBe('target-1');
    expect(targetManager.assertProjectAccess).toHaveBeenCalledWith('proj-1', 'brand-1');
    expect(qualityAnalyzer.analyzeQuality).toHaveBeenCalled();
    expect(featureExtractor.extractFeatures).toHaveBeenCalled();
    expect(prisma.aRImageTarget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          name: 'Poster',
          physicalWidth: 30,
          physicalHeight: 20,
          linkedModelId: 'model-1',
        }),
      }),
    );
  });

  it('should analyze quality', async () => {
    qualityAnalyzer.analyzeQuality.mockResolvedValue({
      trackingQuality: 'EXCELLENT',
      score: 0.95,
      qualityIssues: [],
      recommendations: [],
    });
    featureExtractor.extractFeatures.mockResolvedValue({ featurePointCount: 200 });
    storage.uploadBuffer.mockResolvedValue('https://cdn.example.com/img.png');
    prisma.aRImageTarget.create.mockResolvedValue({
      ...sampleTarget,
      trackingQuality: 'EXCELLENT',
      qualityScore: 0.95,
    });

    await service.createTarget(
      'proj-1',
      'brand-1',
      { buffer: Buffer.alloc(500), originalname: 'x.png' },
      { name: 'T', physicalWidthCm: 10, physicalHeightCm: 10 },
    );

    expect(qualityAnalyzer.analyzeQuality).toHaveBeenCalled();
  });

  it('should link to models', async () => {
    prisma.aRImageTarget.create.mockResolvedValue(sampleTarget);
    storage.uploadBuffer.mockResolvedValue('https://cdn.example.com/img.png');

    await service.createTarget(
      'proj-1',
      'brand-1',
      { buffer: Buffer.alloc(500), originalname: 'x.png' },
      { name: 'T', physicalWidthCm: 10, physicalHeightCm: 10, linkedModelId: 'model-1' },
    );

    expect(prisma.aRImageTarget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ linkedModelId: 'model-1' }),
      }),
    );
  });

  it('should soft delete', async () => {
    targetManager.getTargetById.mockResolvedValue(sampleTarget);
    prisma.aRImageTarget.update.mockResolvedValue({ ...sampleTarget, isActive: false });

    const result = await service.deleteTarget('target-1', 'brand-1');

    expect(result.ok).toBe(true);
    expect(prisma.aRImageTarget.update).toHaveBeenCalledWith({
      where: { id: 'target-1' },
      data: { isActive: false },
    });
  });

  it('should throw BadRequestException when file buffer missing', async () => {
    await expect(
      service.createTarget(
        'proj-1',
        'brand-1',
        {} as never,
        { name: 'T', physicalWidthCm: 10, physicalHeightCm: 10 },
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createTarget(
        'proj-1',
        'brand-1',
        {} as never,
        { name: 'T', physicalWidthCm: 10, physicalHeightCm: 10 },
      ),
    ).rejects.toThrow(/Image file is required/);
  });

  it('should update target and link to model', async () => {
    targetManager.getTargetById.mockResolvedValue(sampleTarget);
    prisma.aRImageTarget.update.mockResolvedValue({
      ...sampleTarget,
      linkedModelId: 'model-2',
      linkedModel: { id: 'model-2', name: 'Model 2' },
    });

    const result = await service.updateTarget('target-1', 'brand-1', { linkedModelId: 'model-2' });
    expect(result.linkedModelId).toBe('model-2');
  });
});
