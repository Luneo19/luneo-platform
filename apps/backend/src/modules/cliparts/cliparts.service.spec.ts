/**
 * ClipartsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ClipartsService } from './cliparts.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('ClipartsService', () => {
  let service: ClipartsService;
  let _prisma: PrismaService;

  const mockPrisma = {
    clipart: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const userId = 'user-1';
  const brandId = 'brand-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClipartsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClipartsService>(ClipartsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated cliparts', async () => {
      const cliparts = [{ id: 'c1', name: 'Clipart 1', userId, brandId }];
      mockPrisma.clipart.findMany.mockResolvedValue(cliparts);
      mockPrisma.clipart.count.mockResolvedValue(1);

      const result = await service.findAll(userId, brandId, { page: 1, limit: 10 });

      expect(result.cliparts).toEqual(cliparts);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(mockPrisma.clipart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('should cap limit at 100', async () => {
      mockPrisma.clipart.findMany.mockResolvedValue([]);
      mockPrisma.clipart.count.mockResolvedValue(0);

      await service.findAll(userId, brandId, { page: 1, limit: 200 });

      expect(mockPrisma.clipart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return clipart when found and user has access', async () => {
      const clipart = { id: 'c1', name: 'Test', userId, brandId, isPublic: false };
      mockPrisma.clipart.findUnique.mockResolvedValue(clipart);

      const result = await service.findOne('c1', userId, brandId);

      expect(result).toEqual(clipart);
    });

    it('should throw NotFoundException when clipart not found', async () => {
      mockPrisma.clipart.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing', userId, brandId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing', userId, brandId)).rejects.toThrow('Clipart not found');
    });

    it('should throw ForbiddenException when user has no access', async () => {
      const clipart = { id: 'c1', userId: 'other', brandId: 'other', isPublic: false };
      mockPrisma.clipart.findUnique.mockResolvedValue(clipart);

      await expect(service.findOne('c1', userId, brandId)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('c1', userId, brandId)).rejects.toThrow('Access denied');
    });
  });

  describe('create', () => {
    it('should create clipart with user and brand', async () => {
      const data = {
        name: 'New Clipart',
        category: 'icons',
        url: 'https://example.com/img.png',
      };
      const created = { id: 'c1', ...data, userId, brandId };
      mockPrisma.clipart.create.mockResolvedValue(created);

      const result = await service.create(data, userId, brandId);

      expect(result).toEqual(created);
      expect(mockPrisma.clipart.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: data.name,
          category: data.category,
          url: data.url,
          userId,
          brandId,
          isPublic: false,
          tags: [],
        }),
      });
    });
  });

  describe('update', () => {
    it('should update clipart when user is owner', async () => {
      const existing = { id: 'c1', name: 'Old', userId, brandId };
      mockPrisma.clipart.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, name: 'New Name' };
      mockPrisma.clipart.update.mockResolvedValue(updated);

      const result = await service.update('c1', { name: 'New Name' }, userId, brandId);

      expect(result.name).toBe('New Name');
      expect(mockPrisma.clipart.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: expect.objectContaining({ name: 'New Name' }),
      });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const existing = { id: 'c1', userId: 'other', brandId: 'other' };
      mockPrisma.clipart.findUnique.mockResolvedValue(existing);

      await expect(
        service.update('c1', { name: 'New' }, userId, brandId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete clipart when user is owner', async () => {
      const existing = { id: 'c1', userId, brandId };
      mockPrisma.clipart.findUnique.mockResolvedValue(existing);
      mockPrisma.clipart.delete.mockResolvedValue(existing);

      const result = await service.delete('c1', userId, brandId);

      expect(result).toEqual({ success: true, message: 'Clipart deleted successfully' });
      expect(mockPrisma.clipart.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const existing = { id: 'c1', userId: 'other', brandId: 'other' };
      mockPrisma.clipart.findUnique.mockResolvedValue(existing);

      await expect(service.delete('c1', userId, brandId)).rejects.toThrow(ForbiddenException);
    });
  });
});
