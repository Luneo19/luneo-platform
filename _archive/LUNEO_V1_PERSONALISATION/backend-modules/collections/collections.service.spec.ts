/**
 * CollectionsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let _prisma: PrismaService;

  const mockPrisma: Record<string, unknown> = {
    designCollection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    designCollectionItem: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    design: {
      findUnique: jest.fn(),
    },
  };

  const userId = 'user-1';
  const brandId = 'brand-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated collections', async () => {
      const collections = [{ id: 'col1', name: 'My Collection', userId, brandId, items: [] }];
      mockPrisma.designCollection.findMany.mockResolvedValue(collections);
      mockPrisma.designCollection.count.mockResolvedValue(1);

      const result = await service.findAll(userId, brandId, { page: 1, limit: 10 });

      expect(result.collections).toEqual(collections);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.designCollection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId, brandId }), skip: 0, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return collection when found and user owns it', async () => {
      const collection = {
        id: 'col1',
        userId,
        brandId,
        _count: { items: 0 },
        items: [],
        user: {},
      };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);

      const result = await service.findOne('col1', userId, brandId);

      expect(result).toMatchObject({ id: 'col1', pagination: expect.any(Object) });
    });

    it('should throw NotFoundException when collection not found', async () => {
      mockPrisma.designCollection.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing', userId, brandId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing', userId, brandId)).rejects.toThrow(
        'Collection not found',
      );
    });

    it('should throw ForbiddenException when user does not own collection', async () => {
      const collection = { id: 'col1', userId: 'other', brandId: 'other', _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);

      await expect(service.findOne('col1', userId, brandId)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('col1', userId, brandId)).rejects.toThrow('Access denied');
    });
  });

  describe('create', () => {
    it('should create collection', async () => {
      const data = { name: 'New Collection', description: 'Desc', isPublic: false };
      const created = { id: 'col1', ...data, userId, brandId, items: [] };
      mockPrisma.designCollection.create.mockResolvedValue(created);

      const result = await service.create(data, userId, brandId);

      expect(result).toEqual(created);
      expect(mockPrisma.designCollection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: data.name, userId, brandId }),
        include: { items: true },
      });
    });
  });

  describe('update', () => {
    it('should update collection when user owns it', async () => {
      const existing = { id: 'col1', userId, brandId, _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, name: 'Updated Name' };
      mockPrisma.designCollection.update.mockResolvedValue(updated);

      const _result = await service.update('col1', { name: 'Updated Name' }, userId, brandId);

      expect(mockPrisma.designCollection.update).toHaveBeenCalledWith({
        where: { id: 'col1' },
        data: expect.objectContaining({ name: 'Updated Name' }),
        include: expect.any(Object),
      });
    });
  });

  describe('delete', () => {
    it('should delete collection when user owns it', async () => {
      const existing = { id: 'col1', userId, brandId, _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(existing);
      mockPrisma.designCollection.delete.mockResolvedValue(existing);

      const result = await service.delete('col1', userId, brandId);

      expect(result).toEqual({ success: true, message: 'Collection deleted successfully' });
      expect(mockPrisma.designCollection.delete).toHaveBeenCalledWith({ where: { id: 'col1' } });
    });
  });

  describe('addItem', () => {
    it('should add design to collection', async () => {
      const collection = { id: 'col1', userId, brandId, _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);
      mockPrisma.design.findUnique.mockResolvedValue({ id: 'd1', brandId });
      mockPrisma.designCollectionItem.findUnique.mockResolvedValue(null);
      mockPrisma.designCollectionItem.findFirst.mockResolvedValue(null);
      const newItem = { id: 'item1', collectionId: 'col1', designId: 'd1', order: 1, design: {} };
      mockPrisma.designCollectionItem.create.mockResolvedValue(newItem);
      mockPrisma.designCollection.update.mockResolvedValue({});

      const result = await service.addItem('col1', 'd1', undefined, userId, brandId);

      expect(result).toEqual(newItem);
      expect(mockPrisma.designCollectionItem.create).toHaveBeenCalled();
      expect(mockPrisma.designCollection.update).toHaveBeenCalledWith({
        where: { id: 'col1' },
        data: { itemCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when design not found', async () => {
      const collection = { id: 'col1', userId, brandId, _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);
      mockPrisma.design.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('col1', 'missing', undefined, userId, brandId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.addItem('col1', 'missing', undefined, userId, brandId),
      ).rejects.toThrow('Design not found');
    });

    it('should throw BadRequestException when design already in collection', async () => {
      const collection = { id: 'col1', userId, brandId, _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);
      mockPrisma.design.findUnique.mockResolvedValue({ id: 'd1', brandId });
      mockPrisma.designCollectionItem.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.addItem('col1', 'd1', undefined, userId, brandId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addItem('col1', 'd1', undefined, userId, brandId),
      ).rejects.toThrow('Design already in collection');
    });
  });

  describe('removeItem', () => {
    it('should remove item from collection', async () => {
      const collection = { id: 'col1', userId, brandId, _count: { items: 1 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);
      mockPrisma.designCollectionItem.findUnique.mockResolvedValue({
        id: 'item1',
        collectionId: 'col1',
        designId: 'd1',
      });
      mockPrisma.designCollectionItem.delete.mockResolvedValue({});
      mockPrisma.designCollection.update.mockResolvedValue({});

      const result = await service.removeItem('col1', 'd1', userId, brandId);

      expect(result).toEqual({ success: true, message: 'Item removed from collection' });
      expect(mockPrisma.designCollectionItem.delete).toHaveBeenCalledWith({
        where: { collectionId_designId: { collectionId: 'col1', designId: 'd1' } },
      });
    });

    it('should throw NotFoundException when item not in collection', async () => {
      const collection = { id: 'col1', userId, brandId, _count: { items: 0 }, items: [], user: {} };
      mockPrisma.designCollection.findUnique.mockResolvedValue(collection);
      mockPrisma.designCollectionItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeItem('col1', 'd1', userId, brandId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeItem('col1', 'd1', userId, brandId),
      ).rejects.toThrow('Item not found in collection');
    });
  });
});
