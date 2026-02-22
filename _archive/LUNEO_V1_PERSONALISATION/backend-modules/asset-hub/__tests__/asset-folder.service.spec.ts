/**
 * AssetFolderService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AssetFolderService } from '../services/asset-folder.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('AssetFolderService', () => {
  let service: AssetFolderService;
  let _prisma: PrismaService;

  const mockPrisma = {
    assetFolder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const orgId = 'org-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetFolderService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AssetFolderService>(AssetFolderService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return folders for organization', async () => {
      const data = [{ id: 'fd1', name: 'Assets', path: 'Assets', _count: { files: 2, children: 0 } }];
      mockPrisma.assetFolder.findMany.mockResolvedValue(data);

      const result = await service.findAll(orgId);

      expect(result).toEqual(data);
      expect(mockPrisma.assetFolder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: orgId, parentId: null },
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should filter by parentId when provided', async () => {
      mockPrisma.assetFolder.findMany.mockResolvedValue([]);

      await service.findAll(orgId, 'parent-1');

      expect(mockPrisma.assetFolder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: orgId, parentId: 'parent-1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return folder when found', async () => {
      const folder = { id: 'fd1', name: 'Assets', path: 'Assets', parent: null, children: [], _count: { files: 0, children: 0 } };
      mockPrisma.assetFolder.findFirst.mockResolvedValue(folder);

      const result = await service.findOne('fd1', orgId);

      expect(result).toEqual(folder);
      expect(mockPrisma.assetFolder.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'fd1', brandId: orgId } }),
      );
    });

    it('should throw NotFoundException when folder not found', async () => {
      mockPrisma.assetFolder.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', orgId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', orgId)).rejects.toThrow(
        /Asset folder with ID missing not found/,
      );
    });
  });

  describe('create', () => {
    it('should create folder at root', async () => {
      const created = { id: 'fd1', name: 'New Folder', path: 'New Folder', createdAt: new Date() };
      mockPrisma.assetFolder.create.mockResolvedValue(created);

      const result = await service.create(orgId, { name: 'New Folder' } as unknown);

      expect(result).toEqual(created);
      expect(mockPrisma.assetFolder.create).toHaveBeenCalledWith({
        data: { brandId: orgId, name: 'New Folder', parentId: undefined, path: 'New Folder' },
        select: expect.any(Object),
      });
    });

    it('should create folder under parent and set path', async () => {
      mockPrisma.assetFolder.findFirst.mockResolvedValue({ id: 'parent1', path: 'Parent' });
      mockPrisma.assetFolder.findUnique.mockResolvedValue({ path: 'Parent' });
      const created = { id: 'fd2', name: 'Child', path: 'Parent/Child', createdAt: new Date() };
      mockPrisma.assetFolder.create.mockResolvedValue(created);

      const result = await service.create(orgId, { name: 'Child', parentId: 'parent1' } as unknown);

      expect(result.path).toBe('Parent/Child');
      expect(mockPrisma.assetFolder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ path: 'Parent/Child', parentId: 'parent1' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete empty folder', async () => {
      const folder = { id: 'fd1', name: 'Empty', _count: { files: 0, children: 0 } };
      mockPrisma.assetFolder.findFirst.mockResolvedValue(folder);
      mockPrisma.assetFolder.delete.mockResolvedValue({ id: 'fd1', name: 'Empty', parentId: null });

      const result = await service.remove('fd1', orgId);

      expect(result.success).toBe(true);
      expect(result.id).toBe('fd1');
      expect(mockPrisma.assetFolder.delete).toHaveBeenCalledWith({ where: { id: 'fd1' } });
    });

    it('should throw BadRequestException when folder has files or children', async () => {
      const folder = { id: 'fd1', name: 'WithContent', _count: { files: 1, children: 0 } };
      mockPrisma.assetFolder.findFirst.mockResolvedValue(folder);

      await expect(service.remove('fd1', orgId)).rejects.toThrow(BadRequestException);
      await expect(service.remove('fd1', orgId)).rejects.toThrow(
        /contains files or subfolders/,
      );
      expect(mockPrisma.assetFolder.delete).not.toHaveBeenCalled();
    });
  });
});
