import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModelManagementService } from '../services/model-management.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

describe('ModelManagementService', () => {
  let service: ModelManagementService;
  let prisma: jest.Mocked<PrismaService>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const mockPrisma = {
      tryOnProductMapping: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockStorage = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelManagementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ModelManagementService>(ModelManagementService);
    prisma = module.get(PrismaService);
    storage = module.get(StorageService);
  });

  describe('uploadModel', () => {
    const mockFile = {
      buffer: Buffer.from('test model data'),
      mimetype: 'model/gltf-binary',
      originalname: 'watch.glb',
    };

    const mockOptions = {
      configurationId: 'config-1',
      productId: 'prod-1',
      format: 'glb' as const,
    };

    it('should upload a GLB model successfully', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
        configurationId: 'config-1',
        productId: 'prod-1',
      });

      (storage.uploadFile as jest.Mock).mockResolvedValue('https://cdn.example.com/model.glb');

      (prisma.tryOnProductMapping.update as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
        model3dUrl: 'https://cdn.example.com/model.glb',
        modelUSDZUrl: null,
        thumbnailUrl: null,
        defaultPosition: null,
        defaultRotation: null,
        enableOcclusion: true,
        enableShadows: true,
        scaleFactor: 1.0,
        product: { id: 'prod-1', name: 'Test Watch' },
      });

      const result = await service.uploadModel(mockFile, mockOptions);

      expect(result.model3dUrl).toBe('https://cdn.example.com/model.glb');
      expect(storage.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('try-on/models/config-1/prod-1/'),
        mockFile.buffer,
        mockFile.mimetype,
      );
    });

    it('should reject files exceeding size limit', async () => {
      const largeFile = {
        ...mockFile,
        buffer: Buffer.alloc(51 * 1024 * 1024), // 51 MB
      };

      await expect(service.uploadModel(largeFile, mockOptions)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid file extensions', async () => {
      const invalidFile = {
        ...mockFile,
        originalname: 'model.obj',
      };

      await expect(
        service.uploadModel(invalidFile, mockOptions),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.uploadModel(mockFile, mockOptions)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should upload USDZ to modelUSDZUrl field', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
      });

      (storage.uploadFile as jest.Mock).mockResolvedValue('https://cdn.example.com/model.usdz');

      (prisma.tryOnProductMapping.update as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
        modelUSDZUrl: 'https://cdn.example.com/model.usdz',
      });

      const usdzFile = { ...mockFile, originalname: 'watch.usdz' };
      await service.uploadModel(usdzFile, { ...mockOptions, format: 'usdz' });

      expect(prisma.tryOnProductMapping.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modelUSDZUrl: 'https://cdn.example.com/model.usdz',
          }),
        }),
      );
    });
  });

  describe('deleteModel', () => {
    it('should delete model from mapping', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
      });

      (prisma.tryOnProductMapping.update as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
      });

      const result = await service.deleteModel('config-1', 'prod-1', 'all');
      expect(result.success).toBe(true);
      expect(result.deletedFormat).toBe('all');
    });

    it('should throw NotFoundException when mapping not found', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteModel('config-1', 'prod-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getModelInfo', () => {
    it('should return model info with fallback image', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
        model3dUrl: null,
        modelUSDZUrl: null,
        thumbnailUrl: null,
        product: {
          id: 'prod-1',
          name: 'Ring',
          images: ['https://cdn.example.com/ring.jpg'],
        },
      });

      const result = await service.getModelInfo('config-1', 'prod-1');
      expect(result.hasModel3d).toBe(false);
      expect(result.fallbackImage).toBe('https://cdn.example.com/ring.jpg');
      expect(result.modelSource).toBe('catalog');
    });

    it('should indicate dedicated model source when model exists', async () => {
      (prisma.tryOnProductMapping.findUnique as jest.Mock).mockResolvedValue({
        id: 'mapping-1',
        model3dUrl: 'https://cdn.example.com/ring.glb',
        modelUSDZUrl: null,
        thumbnailUrl: null,
        product: {
          id: 'prod-1',
          name: 'Ring',
          images: [],
        },
      });

      const result = await service.getModelInfo('config-1', 'prod-1');
      expect(result.hasModel3d).toBe(true);
      expect(result.modelSource).toBe('dedicated');
    });
  });
});
