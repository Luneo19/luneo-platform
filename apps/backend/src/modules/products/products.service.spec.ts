/**
 * ProductsService - Tests unitaires
 * Tests pour la gestion des produits
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthorizationError } from '@/common/errors/app-error';
import { ProductsService } from './products.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { createTestingModule, testFixtures, testHelpers } from '@/common/test/test-setup';
import { UserRole } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<SmartCacheService>;

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule([
      ProductsService,
    ]);

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      // Arrange
      const mockProducts = [testFixtures.product];
      (prismaService.product.findMany as any).mockResolvedValue(mockProducts as any);
      (prismaService.product.count as any).mockResolvedValue(1);

      // Act
      const result = await service.findAll({}, { page: 1, limit: 10 });

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(prismaService.product.findMany).toHaveBeenCalled();
    });

    it('should filter by brandId when provided', async () => {
      // Arrange
      const query = { brandId: 'brand_123' };
      (prismaService.product.findMany as any).mockResolvedValue([testFixtures.product] as any);
      (prismaService.product.count as any).mockResolvedValue(1);

      // Act
      await service.findAll(query, { page: 1, limit: 10 });

      // Assert
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId: 'brand_123',
          }),
        }),
      );
    });

    it('should filter by isPublic when provided', async () => {
      // Arrange
      const query = { isPublic: true };
      (prismaService.product.findMany as any).mockResolvedValue([testFixtures.product] as any);
      (prismaService.product.count as any).mockResolvedValue(1);

      // Act
      await service.findAll(query, { page: 1, limit: 10 });

      // Assert
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublic: true,
          }),
        }),
      );
    });

    it('should use select instead of include for optimization', async () => {
      // Arrange
      (prismaService.product.findMany as any).mockResolvedValue([testFixtures.product] as any);
      (prismaService.product.count as any).mockResolvedValue(1);

      // Act
      await service.findAll({}, { page: 1, limit: 10 });

      // Assert
      const callArgs = (prismaService.product.findMany as any).mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.include).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      // Arrange
      (prismaService.product.findUnique as any).mockResolvedValue(testFixtures.product as any);

      // Act
      const result = await service.findOne('prod_123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('prod_123');
      expect(prismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod_123' },
        }),
      );
    });

    it('should throw NotFoundError if product not found', async () => {
      // Arrange
      (prismaService.product.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid_id')).rejects.toThrow();
      testHelpers.expectNotFound(
        await service.findOne('invalid_id').catch(e => e),
        'Product',
      );
    });

    it('should use select for optimization', async () => {
      // Arrange
      (prismaService.product.findUnique as any).mockResolvedValue(testFixtures.product as any);

      // Act
      await service.findOne('prod_123');

      // Assert
      const callArgs = (prismaService.product.findUnique as any).mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.include).toBeUndefined();
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Product',
      description: 'New Description',
      price: 39.99,
    };

    it('should create product successfully', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: UserRole.CONSUMER };
      (prismaService.product.create as any).mockResolvedValue({
        ...testFixtures.product,
        ...createDto,
      } as any);

      // Act
      const result = await service.create('brand_123', createDto, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(prismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...createDto,
            brandId: 'brand_123',
          }),
        }),
      );
    });

    it('should throw AuthorizationError if user does not have access to brand', async () => {
      // Arrange
      const currentUser = {
        ...testFixtures.currentUser,
        role: UserRole.CONSUMER,
        brandId: 'different_brand',
      };

      // Act & Assert
      await expect(
        service.create('brand_123', createDto, currentUser),
      ).rejects.toThrow(AuthorizationError);
      expect(prismaService.product.create).not.toHaveBeenCalled();
    });

    it('should allow PLATFORM_ADMIN to create products for any brand', async () => {
      // Arrange
      const currentUser = {
        ...testFixtures.currentUser,
        role: UserRole.PLATFORM_ADMIN,
        brandId: 'different_brand',
      };
      (prismaService.product.create as any).mockResolvedValue(testFixtures.product as any);

      // Act
      await service.create('brand_123', createDto, currentUser);

      // Assert
      expect(prismaService.product.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product',
      price: 49.99,
    };
    const currentUser = { ...testFixtures.currentUser, role: UserRole.CONSUMER };

    it('should update product successfully', async () => {
      // Arrange
      const currentUserWithBrand = { ...testFixtures.currentUser, brandId: 'brand_123' };
      (prismaService.product.findUnique as any).mockResolvedValue({
        ...testFixtures.product,
        brandId: 'brand_123',
      } as any);
      (prismaService.product.update as any).mockResolvedValue({
        ...testFixtures.product,
        ...updateDto,
        brandId: 'brand_123',
      } as any);

      // Act
      const result = await service.update('brand_123', 'prod_123', updateDto, currentUserWithBrand);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
      expect(prismaService.product.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if product not found', async () => {
      // Arrange
      (prismaService.product.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('invalid_id', 'brand_123', updateDto, currentUser)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    const currentUser = { ...testFixtures.currentUser, role: UserRole.CONSUMER };

    it('should delete product successfully', async () => {
      // Arrange
      (prismaService.product.findUnique as any).mockResolvedValue(testFixtures.product as any);
      (prismaService.product.delete as any).mockResolvedValue(testFixtures.product as any);

      // Act
      await service.remove('prod_123', 'brand_123', currentUser);

      // Assert
      expect(prismaService.product.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod_123' },
        }),
      );
    });

    it('should throw NotFoundError if product not found', async () => {
      // Arrange
      (prismaService.product.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('invalid_id', 'brand_123', currentUser)).rejects.toThrow();
    });
  });
});

