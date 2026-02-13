/**
 * SearchService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../search.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: { findMany: jest.fn() },
    design: { findMany: jest.fn() },
    order: { findMany: jest.fn() },
  };

  const platformAdmin = {
    id: 'u1',
    email: 'admin@luneo.app',
    role: UserRole.PLATFORM_ADMIN,
    brandId: null,
  } as any;

  const brandUser = {
    id: 'u2',
    email: 'user@brand.com',
    role: UserRole.BRAND_ADMIN,
    brandId: 'brand-1',
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return empty results when query is empty', async () => {
      const result = await service.search(brandUser, '   ', undefined);

      expect(result.results.products).toEqual([]);
      expect(result.results.designs).toEqual([]);
      expect(result.results.orders).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should search products and map to SearchResultItem', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Ring', description: 'Gold', thumbnailUrl: 'https://x', images: [] },
      ]);
      mockPrisma.design.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.search(brandUser, 'ring', 'products,designs,orders');

      expect(result.results.products).toHaveLength(1);
      expect(result.results.products[0]).toMatchObject({
        id: 'p1',
        type: 'product',
        title: 'Ring',
        subtitle: 'Gold',
        url: '/dashboard/products/p1',
      });
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ brandId: 'brand-1' }),
        }),
      );
    });

    it('should not filter by brandId for PLATFORM_ADMIN', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.design.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.search(platformAdmin, 'test', undefined);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ brandId: expect.anything() }),
        }),
      );
    });

    it('should filter by types when types param provided', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.design.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.search(brandUser, 'x', 'orders');

      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.design.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.order.findMany).toHaveBeenCalled();
    });
  });
});
