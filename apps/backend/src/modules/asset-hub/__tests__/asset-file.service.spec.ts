/**
 * AssetFileService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssetFileService } from '../services/asset-file.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

describe('AssetFileService', () => {
  let service: AssetFileService;
  let prisma: PrismaService;
  let storageService: StorageService;

  const mockPrisma = {
    assetFile: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    brand: {
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const orgId = 'org-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetFileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<AssetFileService>(AssetFileService);
    prisma = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated asset files', async () => {
      const data = [{ id: 'f1', name: 'file1.png', brandId: orgId }];
      mockPrisma.assetFile.findMany.mockResolvedValue(data);
      mockPrisma.assetFile.count.mockResolvedValue(1);

      const result = await service.findAll(orgId, {}, { page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.assetFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ brandId: orgId }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return file when found', async () => {
      const file = { id: 'f1', name: 'file.png', brandId: orgId, storageKey: 'key' };
      mockPrisma.assetFile.findFirst.mockResolvedValue(file);

      const result = await service.findOne('f1', orgId);

      expect(result).toEqual(file);
      expect(mockPrisma.assetFile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'f1', brandId: orgId } }),
      );
    });

    it('should throw NotFoundException when file not found', async () => {
      mockPrisma.assetFile.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', orgId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', orgId)).rejects.toThrow(
        /Asset file with ID missing not found/,
      );
    });
  });

  describe('upload', () => {
    it('should throw BadRequestException when file exceeds type limit', async () => {
      const file = { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'x.png', size: 15 * 1024 * 1024 };
      const dto = { name: 'x', type: 'IMAGE', folderId: null, metadata: undefined, tags: [] };

      await expect(
        service.upload(orgId, file, dto as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.upload(orgId, file, dto as any, 'user-1'),
      ).rejects.toThrow(/exceeds limit/);
      expect(mockPrisma.assetFile.create).not.toHaveBeenCalled();
    });

    it('should create file when size valid and quota ok', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: orgId, plan: 'free' });
      mockPrisma.assetFile.aggregate.mockResolvedValue({ _sum: { sizeBytes: 0 } });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/file.png');
      const created = { id: 'f1', name: 'x.png', url: 'https://cdn.example.com/file.png', type: 'IMAGE', createdAt: new Date() };
      mockPrisma.assetFile.create.mockResolvedValue(created);

      const file = { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'x.png', size: 1024 };
      const dto = { name: 'x', type: 'IMAGE', folderId: null, metadata: undefined, tags: [] };

      const result = await service.upload(orgId, file, dto as any, 'user-1');

      expect(result).toEqual(created);
      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockPrisma.assetFile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            brandId: orgId,
            name: 'x',
            type: 'IMAGE',
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete file and call storage delete', async () => {
      const file = { id: 'f1', name: 'x', brandId: orgId, storageKey: 'assets/org/f1', url: 'https://x' };
      mockPrisma.assetFile.findFirst.mockResolvedValue(file);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockPrisma.assetFile.delete.mockResolvedValue({} as any);

      const result = await service.remove('f1', orgId);

      expect(result.success).toBe(true);
      expect(result.id).toBe('f1');
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('assets/org/f1');
      expect(mockPrisma.assetFile.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
    });
  });
});
