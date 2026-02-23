import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BrandsService } from '../brands.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PlatformRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

describe('BrandsService', () => {
  let service: BrandsService;

  const mockPrisma = {
    brand: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    webhook: { create: jest.fn() },
    getDashboardMetrics: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    invalidate: jest.fn().mockResolvedValue(undefined),
  };

  const platformAdmin: CurrentUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: PlatformRole.ADMIN,
    organizationId: null,
  };

  const brandUser: CurrentUser = {
    id: 'user-1',
    email: 'user@brand.com',
    role: PlatformRole.ADMIN,
    organizationId: 'brand-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create brand when user is brand admin', async () => {
      mockCache.get.mockResolvedValue({
        id: 'user-1',
        role: PlatformRole.ADMIN,
      });
      const created = { id: 'brand-1', name: 'New Brand', users: [] };
      mockPrisma.brand.create.mockResolvedValue(created);
      const result = await service.create({ name: 'New Brand' }, 'user-1');
      expect(result).toEqual(created);
      expect(mockPrisma.brand.create).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith('brands:list', 'brand');
    });

    it('should throw ForbiddenException when user is not brand admin', async () => {
      mockCache.get.mockResolvedValue({ id: 'user-1', role: PlatformRole.USER });
      await expect(
        service.create({ name: 'New Brand' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.brand.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return brand when user has access', async () => {
      const brand = { id: 'brand-1', name: 'Test Brand', users: [], products: [] };
      mockCache.get.mockResolvedValue(brand);
      const result = await service.findOne('brand-1', brandUser);
      expect(result).toEqual(brand);
      expect(mockCache.get).toHaveBeenCalledWith(
        'brand:brand-1',
        'brand',
        expect.any(Function),
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      await expect(
        service.findOne('other-brand', brandUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockCache.get.mockResolvedValue(null);
      await expect(service.findOne('brand-1', platformAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update brand when user has access', async () => {
      const updated = { id: 'brand-1', name: 'Updated', users: [] };
      mockPrisma.brand.update.mockResolvedValue(updated);
      const result = await service.update(
        'brand-1',
        { name: 'Updated' },
        brandUser,
      );
      expect(result).toEqual(updated);
      expect(mockCache.invalidate).toHaveBeenCalledWith('brand:brand-1', 'brand');
    });

    it('should throw ForbiddenException when user has no access', async () => {
      await expect(
        service.update('other-brand', { name: 'X' }, brandUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return paginated brands from cache', async () => {
      const brands = [{ id: 'b1', name: 'Brand 1' }];
      mockCache.get.mockResolvedValue(brands);
      const result = await service.findAll(1, 20);
      expect(result).toEqual(brands);
      expect(mockCache.get).toHaveBeenCalled();
    });
  });

  describe('searchBrands', () => {
    it('should return search results from cache', async () => {
      const brands = [{ id: 'b1', name: 'Match' }];
      mockCache.get.mockResolvedValue(brands);
      const result = await service.searchBrands('Match', 10);
      expect(result).toEqual(brands);
    });
  });
});
