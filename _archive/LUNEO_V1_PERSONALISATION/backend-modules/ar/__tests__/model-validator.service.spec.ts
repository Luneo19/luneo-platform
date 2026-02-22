import { Test, TestingModule } from '@nestjs/testing';
import { ModelValidatorService } from '../conversion/validation/model-validator.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ModelValidationStatus } from '@prisma/client';
import { createMockPrismaService, createSampleModel, type ARPrismaMock } from './test-helpers';

describe('ModelValidatorService', () => {
  let service: ModelValidatorService;
  let prisma: ARPrismaMock;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelValidatorService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ModelValidatorService>(ModelValidatorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should pass validation for small valid models', async () => {
    const model = createSampleModel({
      id: 'm1',
      originalFormat: 'glb',
      originalFileSize: 2 * 1024 * 1024,
      polyCount: 50000,
      materialCount: 2,
      validationStatus: ModelValidationStatus.PENDING,
    });
    prisma.aR3DModel.findUnique.mockResolvedValue(model);
    prisma.aR3DModel.update.mockResolvedValue({ ...model, validationStatus: ModelValidationStatus.VALID });

    const result = await service.validate('m1');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ModelValidationStatus.VALID);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.metadata.polyCount).toBe(50000);
  });

  it('should fail validation for oversized models', async () => {
    const model = createSampleModel({
      id: 'm1',
      originalFormat: 'glb',
      originalFileSize: 60 * 1024 * 1024,
      validationStatus: ModelValidationStatus.PENDING,
    });
    prisma.aR3DModel.findUnique.mockResolvedValue(model);
    prisma.aR3DModel.update.mockResolvedValue({ ...model, validationStatus: ModelValidationStatus.INVALID });

    const result = await service.validate('m1');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ModelValidationStatus.INVALID);
    const fileSizeCheck = result.checks.find((c) => c.name === 'file_size');
    expect(fileSizeCheck).toBeDefined();
    expect(fileSizeCheck?.passed).toBe(false);
  });

  it('should return correct validation status', async () => {
    const model = createSampleModel({
      id: 'm1',
      originalFormat: 'glb',
      originalFileSize: 1 * 1024 * 1024,
      validationStatus: ModelValidationStatus.PENDING,
    });
    prisma.aR3DModel.findUnique.mockResolvedValue(model);
    prisma.aR3DModel.update.mockImplementation((args) =>
      Promise.resolve({ ...model, ...args.data }),
    );

    const result = await service.validate('m1');

    expect(result.modelId).toBe('m1');
    expect(['VALID', 'INVALID', 'FIXED_AUTOMATICALLY']).toContain(result.status);
    expect(result.metadata.estimatedLoadTime).toHaveProperty('mobile');
    expect(result.metadata.estimatedLoadTime).toHaveProperty('desktop');
  });

  it('should generate appropriate recommendations', async () => {
    const model = createSampleModel({
      id: 'm1',
      originalFormat: 'fbx',
      originalFileSize: 20 * 1024 * 1024,
      polyCount: 150000,
      validationStatus: ModelValidationStatus.PENDING,
    });
    prisma.aR3DModel.findUnique.mockResolvedValue(model);
    prisma.aR3DModel.update.mockResolvedValue(model);

    const result = await service.validate('m1');

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.checks.some((c) => c.name === 'format')).toBe(true);
  });

  it('should detect AR-ready vs convertible formats', async () => {
    prisma.aR3DModel.findUnique.mockResolvedValue(
      createSampleModel({ id: 'm1', originalFormat: 'glb', originalFileSize: 1024, validationStatus: ModelValidationStatus.PENDING }),
    );
    prisma.aR3DModel.update.mockResolvedValue(createSampleModel());

    const resultGlb = await service.validate('m1');
    const formatCheckGlb = resultGlb.checks.find((c) => c.name === 'format');
    expect(formatCheckGlb?.passed).toBe(true);
    expect(formatCheckGlb?.message).toMatch(/AR-ready|glb/i);

    prisma.aR3DModel.findUnique.mockResolvedValue(
      createSampleModel({ id: 'm2', originalFormat: 'fbx', originalFileSize: 1024, validationStatus: ModelValidationStatus.PENDING }),
    );
    const resultFbx = await service.validate('m2');
    const formatCheckFbx = resultFbx.checks.find((c) => c.name === 'format');
    expect(formatCheckFbx?.passed).toBe(true);
    expect(formatCheckFbx?.message).toMatch(/conversion|glTF|USDZ/i);
  });

  it('should throw when model not found', async () => {
    prisma.aR3DModel.findUnique.mockResolvedValue(null);
    await expect(service.validate('missing')).rejects.toThrow(/Model not found|missing/);
  });
});
