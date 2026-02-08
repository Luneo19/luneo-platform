import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { AppErrorFactory } from '@/common/errors/app-error';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    customization: {
      count: jest.fn(),
    },
    design: {
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
  };

  const mockStorageService = {
    uploadBuffer: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'app.frontendUrl': 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  const platformAdmin: CurrentUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.PLATFORM_ADMIN,
    brandId: null,
  };

  const brandUser: CurrentUser = {
    id: 'user-1',
    email: 'user@brand.com',
    role: UserRole.BRAND_ADMIN,
    brandId: 'brand-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Test Product',
          description: 'Test Description',
          price: 29.99,
          isPublic: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          brandId: 'brand-1',
          brand: {
            id: 'brand-1',
            name: 'Test Brand',
            logo: null,
          },
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
      expect(mockPrisma.product.count).toHaveBeenCalled();
    });

    it('should filter by brandId when provided', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ brandId: 'brand-1' }, { page: 1, limit: 10 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId: 'brand-1',
          }),
        }),
      );
    });

    it('should filter by isPublic when provided', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ isPublic: true }, { page: 1, limit: 10 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublic: true,
          }),
        }),
      );
    });

    it('should filter by isActive when provided', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ isActive: true }, { page: 1, limit: 10 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });

    it('should use select instead of include for optimization', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({}, { page: 1, limit: 10 });

      const callArgs = mockPrisma.product.findMany.mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.include).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        isPublic: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        brandId: 'brand-1',
        brand: {
          id: 'brand-1',
          name: 'Test Brand',
          logo: null,
          website: null,
        },
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Test Product');
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
        }),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid_id')).rejects.toThrow();
      await expect(service.findOne('invalid_id')).rejects.toThrow(NotFoundException);
    });

    it('should use select for optimization', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        brand: {},
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await service.findOne('prod-1');

      const callArgs = mockPrisma.product.findUnique.mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.include).toBeUndefined();
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Product',
      description: 'New Description',
      price: 39.99,
      isPublic: true,
      isActive: true,
    };

    it('should create product successfully', async () => {
      const mockProduct = {
        id: 'prod-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        brandId: 'brand-1',
        brand: {
          id: 'brand-1',
          name: 'Test Brand',
          logo: null,
        },
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create('brand-1', createDto, brandUser);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.brandId).toBe('brand-1');
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...createDto,
            brandId: 'brand-1',
          }),
        }),
      );
    });

    it('should throw AuthorizationError if user does not have access to brand', async () => {
      const userWithoutAccess = {
        ...brandUser,
        brandId: 'different-brand',
      };

      await expect(
        service.create('brand-1', createDto, userWithoutAccess),
      ).rejects.toThrow();
      expect(mockPrisma.product.create).not.toHaveBeenCalled();
    });

    it('should allow PLATFORM_ADMIN to create products for any brand', async () => {
      const mockProduct = {
        id: 'prod-1',
        ...createDto,
        brandId: 'brand-1',
        brand: {},
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      await service.create('brand-1', createDto, platformAdmin);

      expect(mockPrisma.product.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product',
      price: 49.99,
    };

    it('should update product successfully', async () => {
      const existingProduct = {
        id: 'prod-1',
        name: 'Original Product',
        brandId: 'brand-1',
      };

      const updatedProduct = {
        id: 'prod-1',
        ...updateDto,
        brandId: 'brand-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        brand: {
          id: 'brand-1',
          name: 'Test Brand',
          logo: null,
        },
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update('brand-1', 'prod-1', updateDto, brandUser);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
      expect(result.price).toBe(updateDto.price);
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: updateDto,
        }),
      );
    });

    it('should throw AuthorizationError if user does not have access', async () => {
      const existingProduct = {
        id: 'prod-1',
        brandId: 'other-brand',
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

      await expect(
        service.update('other-brand', 'prod-1', updateDto, brandUser),
      ).rejects.toThrow();
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should allow PLATFORM_ADMIN to update any product', async () => {
      const existingProduct = {
        id: 'prod-1',
        brandId: 'brand-1',
      };

      const updatedProduct = {
        id: 'prod-1',
        ...updateDto,
        brandId: 'brand-1',
        brand: {},
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      await service.update('brand-1', 'prod-1', updateDto, platformAdmin);

      expect(mockPrisma.product.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete product successfully', async () => {
      const existingProduct = {
        id: 'prod-1',
        name: 'Test Product',
        brandId: 'brand-1',
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.delete.mockResolvedValue(existingProduct);

      const result = await service.remove('prod-1', 'brand-1', brandUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('prod-1');
      expect(mockPrisma.product.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
        }),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid_id', 'brand-1', brandUser)).rejects.toThrow();
    });

    it('should throw AuthorizationError when product belongs to different brand', async () => {
      const existingProduct = {
        id: 'prod-1',
        brandId: 'other-brand',
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

      await expect(service.remove('prod-1', 'brand-1', brandUser)).rejects.toThrow();
      expect(mockPrisma.product.delete).not.toHaveBeenCalled();
    });

    it('should allow PLATFORM_ADMIN to delete any product', async () => {
      const existingProduct = {
        id: 'prod-1',
        brandId: 'brand-1',
      };

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.delete.mockResolvedValue(existingProduct);

      await service.remove('prod-1', 'brand-1', platformAdmin);

      expect(mockPrisma.product.delete).toHaveBeenCalled();
    });
  });

  describe('bulkAction', () => {
    it('should delete multiple products', async () => {
      const productIds = ['prod-1', 'prod-2'];
      const mockProducts = productIds.map((id) => ({ id }));

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkAction('brand-1', productIds, 'delete', brandUser);

      expect(result.deleted).toBe(2);
      expect(mockPrisma.product.deleteMany).toHaveBeenCalled();
    });

    it('should activate multiple products', async () => {
      const productIds = ['prod-1', 'prod-2'];
      const mockProducts = productIds.map((id) => ({ id }));

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkAction('brand-1', productIds, 'activate', brandUser);

      expect(result.updated).toBe(2);
      expect(result.action).toBe('activate');
      expect(mockPrisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        }),
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return product analytics', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.customization.count.mockResolvedValue(5);
      mockPrisma.design.count.mockResolvedValue(10);
      mockPrisma.order.count.mockResolvedValue(3);

      const result = await service.getAnalytics('prod-1');

      expect(result.productId).toBe('prod-1');
      expect(result.productName).toBe('Test Product');
      expect(result.customizations).toBe(5);
      expect(result.designs).toBe(10);
      expect(result.orders).toBe(3);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getAnalytics('invalid_id')).rejects.toThrow();
    });
  });
});
