/**
 * FavoritesService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: PrismaService;

  const mockPrisma = {
    libraryFavorite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const userId = 'user-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated favorites', async () => {
      const favorites = [
        { id: 'f1', userId, resourceId: 'r1', resourceType: 'design' },
      ];
      mockPrisma.libraryFavorite.findMany.mockResolvedValue(favorites);
      mockPrisma.libraryFavorite.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.favorites).toEqual(favorites);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.libraryFavorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId }, skip: 0, take: 10 }),
      );
    });

    it('should filter by type when provided', async () => {
      mockPrisma.libraryFavorite.findMany.mockResolvedValue([]);
      mockPrisma.libraryFavorite.count.mockResolvedValue(0);

      await service.findAll(userId, { type: 'design' });

      expect(mockPrisma.libraryFavorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId, resourceType: 'design' } }),
      );
    });
  });

  describe('create', () => {
    it('should create favorite when not already present', async () => {
      mockPrisma.libraryFavorite.findUnique.mockResolvedValue(null);
      const created = {
        id: 'f1',
        userId,
        resourceId: 'r1',
        resourceType: 'design',
      };
      mockPrisma.libraryFavorite.create.mockResolvedValue(created);

      const result = await service.create({ resourceId: 'r1', resourceType: 'design' }, userId);

      expect(result).toEqual(created);
      expect(mockPrisma.libraryFavorite.create).toHaveBeenCalledWith({
        data: { userId, resourceId: 'r1', resourceType: 'design' },
      });
    });

    it('should throw ConflictException when resource already in favorites', async () => {
      mockPrisma.libraryFavorite.findUnique.mockResolvedValue({
        id: 'f1',
        userId,
        resourceId: 'r1',
        resourceType: 'design',
      });

      await expect(
        service.create({ resourceId: 'r1', resourceType: 'design' }, userId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({ resourceId: 'r1', resourceType: 'design' }, userId),
      ).rejects.toThrow('Resource already in favorites');
    });
  });

  describe('delete', () => {
    it('should delete favorite when user owns it', async () => {
      const favorite = { id: 'f1', userId, resourceId: 'r1', resourceType: 'design' };
      mockPrisma.libraryFavorite.findUnique.mockResolvedValue(favorite);
      mockPrisma.libraryFavorite.delete.mockResolvedValue(favorite);

      const result = await service.delete('f1', userId);

      expect(result).toEqual({ success: true, message: 'Favorite deleted successfully' });
      expect(mockPrisma.libraryFavorite.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
    });

    it('should throw NotFoundException when favorite not found', async () => {
      mockPrisma.libraryFavorite.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing', userId)).rejects.toThrow(NotFoundException);
      await expect(service.delete('missing', userId)).rejects.toThrow('Favorite not found');
    });

    it('should throw NotFoundException when favorite belongs to another user', async () => {
      mockPrisma.libraryFavorite.findUnique.mockResolvedValue({
        id: 'f1',
        userId: 'other',
        resourceId: 'r1',
        resourceType: 'design',
      });

      await expect(service.delete('f1', userId)).rejects.toThrow(NotFoundException);
      await expect(service.delete('f1', userId)).rejects.toThrow('Favorite not found');
    });
  });
});
