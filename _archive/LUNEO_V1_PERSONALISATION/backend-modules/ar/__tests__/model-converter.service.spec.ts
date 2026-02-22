import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { ModelConverterService } from '../conversion/model-converter.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { ModelValidationStatus } from '@prisma/client';
import {
  createMockPrismaService,
  createMockStorageService,
  createMockQueue,
  createSampleModel,
  type ARPrismaMock,
} from './test-helpers';

describe('ModelConverterService', () => {
  let service: ModelConverterService;
  let prisma: ARPrismaMock;
  let storageService: ReturnType<typeof createMockStorageService>;
  let conversionQueue: ReturnType<typeof createMockQueue>;
  let optimizationQueue: ReturnType<typeof createMockQueue>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    storageService = createMockStorageService();
    conversionQueue = createMockQueue();
    optimizationQueue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelConverterService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: QuotasService, useValue: { checkQuota: jest.fn().mockResolvedValue(true), consumeQuota: jest.fn().mockResolvedValue(undefined), getQuota: jest.fn().mockResolvedValue({ used: 0, limit: 100, remaining: 100 }) } },
        { provide: getQueueToken('ar-conversion'), useValue: conversionQueue },
        { provide: getQueueToken('ar-optimization'), useValue: optimizationQueue },
      ],
    }).compile();

    service = module.get<ModelConverterService>(ModelConverterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadAndConvert - format validation', () => {
    it('should validate supported formats', async () => {
      prisma.aR3DModel.create.mockResolvedValue(
        createSampleModel({ id: 'new-1', originalFormat: 'glb', validationStatus: ModelValidationStatus.PENDING }),
      );
      prisma.aR3DModel.findUnique.mockResolvedValue(
        createSampleModel({ id: 'new-1', originalFormat: 'glb' }),
      );
      prisma.aRModelConversion.create.mockResolvedValue({
        id: 'conv-1',
        modelId: 'new-1',
        sourceFormat: 'glb',
        targetFormat: 'usdz',
        status: 'PENDING',
      });
      conversionQueue.add.mockResolvedValue({ id: 'job-1' });
      optimizationQueue.add.mockResolvedValue({ id: 'job-2' });

      const file = {
        buffer: Buffer.from('x'),
        mimetype: 'model/gltf-binary',
        originalname: 'model.glb',
        size: 1024,
      };
      const result = await service.uploadAndConvert('project-1', file, { autoConvert: true });

      expect(result.model).toBeDefined();
      expect(result.model.status).toBe(ModelValidationStatus.PENDING);
      expect(result.conversionJobIds).toBeDefined();
      expect(prisma.aR3DModel.create).toHaveBeenCalled();
    });

    it('should reject unsupported formats', async () => {
      const file = {
        buffer: Buffer.from('x'),
        mimetype: 'application/octet-stream',
        originalname: 'model.xyz',
        size: 1024,
      };
      await expect(service.uploadAndConvert('project-1', file)).rejects.toThrow(BadRequestException);
      await expect(service.uploadAndConvert('project-1', file)).rejects.toThrow(/Format non supporte|unsupported/i);
      expect(prisma.aR3DModel.create).not.toHaveBeenCalled();
    });

    it('should reject files over max size', async () => {
      const file = {
        buffer: Buffer.alloc(1),
        mimetype: 'model/gltf-binary',
        originalname: 'model.glb',
        size: 201 * 1024 * 1024,
      };
      await expect(service.uploadAndConvert('project-1', file)).rejects.toThrow(BadRequestException);
      await expect(service.uploadAndConvert('project-1', file)).rejects.toThrow(/trop volumineux|Maximum/i);
      expect(prisma.aR3DModel.create).not.toHaveBeenCalled();
    });
  });

  describe('uploadAndConvert - AR3DModel record', () => {
    it('should create AR3DModel record on upload', async () => {
      const created = createSampleModel({
        id: 'created-1',
        name: 'My Model',
        originalFormat: 'fbx',
        validationStatus: ModelValidationStatus.PENDING,
      });
      prisma.aR3DModel.create.mockResolvedValue(created);
      prisma.aR3DModel.findUnique.mockResolvedValue({
        ...created,
        originalFormat: 'fbx',
        originalFileURL: 'https://cdn.example.com/uploaded.fbx',
      });
      prisma.aRModelConversion.create.mockResolvedValue({
        id: 'conv-1',
        modelId: 'created-1',
        sourceFormat: 'fbx',
        targetFormat: 'glb',
        status: 'PENDING',
      });
      conversionQueue.add.mockResolvedValue({ id: 'j1' });
      optimizationQueue.add.mockResolvedValue({ id: 'j2' });

      const file = {
        buffer: Buffer.from('x'),
        mimetype: 'application/octet-stream',
        originalname: 'chair.fbx',
        size: 2 * 1024 * 1024,
      };
      const result = await service.uploadAndConvert('project-1', file, { name: 'Chair', autoConvert: true });

      expect(prisma.aR3DModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'project-1',
            originalFormat: 'fbx',
            originalFileSize: file.size,
            validationStatus: ModelValidationStatus.PENDING,
          }),
        }),
      );
      expect(result.model.id).toBe('created-1');
      expect(result.model.name).toBe('My Model');
    });
  });

  describe('convertModel - queue jobs', () => {
    it('should queue conversion jobs', async () => {
      const model = createSampleModel({ id: 'm1', originalFormat: 'glb', originalFileURL: 'https://cdn.example.com/m.glb' });
      prisma.aR3DModel.findUnique.mockResolvedValue(model);
      prisma.aRModelConversion.create
        .mockResolvedValueOnce({ id: 'c1', modelId: 'm1', sourceFormat: 'glb', targetFormat: 'usdz', status: 'PENDING' })
        .mockResolvedValueOnce({ id: 'c2', modelId: 'm1', sourceFormat: 'glb', targetFormat: 'draco', status: 'PENDING' });
      conversionQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await service.convertModel({
        modelId: 'm1',
        targetFormats: ['usdz', 'draco'],
        optimize: true,
      });

      expect(result.jobIds).toHaveLength(2);
      expect(prisma.aRModelConversion.create).toHaveBeenCalledTimes(2);
      expect(conversionQueue.add).toHaveBeenCalledWith(
        'convert-model',
        expect.objectContaining({
          modelId: 'm1',
          sourceFormat: 'glb',
          targetFormat: 'usdz',
          sourceUrl: 'https://cdn.example.com/m.glb',
        }),
        expect.any(Object),
      );
    });

    it('should return correct default target formats per source format (glb -> usdz, draco)', async () => {
      const model = createSampleModel({ id: 'm1', originalFormat: 'glb', originalFileURL: 'https://cdn.example.com/m.glb' });
      prisma.aR3DModel.findUnique.mockResolvedValue(model);
      prisma.aR3DModel.update.mockResolvedValue(model);
      prisma.aRModelConversion.create.mockImplementation(
        (args: { data: { targetFormat: string } }) =>
          Promise.resolve({
            id: 'c1',
            modelId: 'm1',
            sourceFormat: 'glb',
            targetFormat: args.data.targetFormat,
            status: 'PENDING',
          }),
      );
      conversionQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.convertModel({ modelId: 'm1', targetFormats: ['usdz', 'draco'] });

      const calls = conversionQueue.add.mock.calls;
      const addedTargets = calls.map((c) => (c[1] as { targetFormat: string }).targetFormat);
      expect(addedTargets).toContain('usdz');
      expect(addedTargets).toContain('draco');
    });

    it('should throw when model not found for convertModel', async () => {
      prisma.aR3DModel.findUnique.mockResolvedValue(null);
      await expect(
        service.convertModel({ modelId: 'missing', targetFormats: ['usdz'] }),
      ).rejects.toThrow(BadRequestException);
      expect(conversionQueue.add).not.toHaveBeenCalled();
    });

    it('should throw when source format unsupported in convertModel', async () => {
      prisma.aR3DModel.findUnique.mockResolvedValue(
        createSampleModel({ id: 'm1', originalFormat: 'xyz' }),
      );
      await expect(
        service.convertModel({ modelId: 'm1', targetFormats: ['usdz'] }),
      ).rejects.toThrow(BadRequestException);
      expect(conversionQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getConversionStatus', () => {
    it('should return conversion status and overall progress', async () => {
      prisma.aRModelConversion.findMany.mockResolvedValue([
        { id: 'c1', modelId: 'm1', sourceFormat: 'glb', targetFormat: 'usdz', status: 'COMPLETED', processingTime: 1000, errorMessage: null },
        { id: 'c2', modelId: 'm1', sourceFormat: 'glb', targetFormat: 'draco', status: 'PENDING', processingTime: null, errorMessage: null },
      ]);
      const result = await service.getConversionStatus('m1');
      expect(result.modelId).toBe('m1');
      expect(result.conversions).toHaveLength(2);
      expect(result.overallProgress).toBe(50);
    });
  });
});
