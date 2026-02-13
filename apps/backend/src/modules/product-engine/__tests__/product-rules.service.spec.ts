import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductRulesService } from '../services/product-rules.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import type { ProductRules, ZoneValidationContext, ProductZone } from '../interfaces/product-rules.interface';

describe('ProductRulesService', () => {
  let service: ProductRulesService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    design: { groupBy: jest.fn() },
    order: { count: jest.fn() },
  };

  const mockCache = {
    getSimple: jest.fn(),
    setSimple: jest.fn().mockResolvedValue(undefined),
    delSimple: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRulesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ProductRulesService>(ProductRulesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductRules', () => {
    it('should return rules from cache when present', async () => {
      const rules = { zones: [{ id: 'z1', label: 'Front', type: 'text', x: 0, y: 0, width: 100, height: 50 }] };
      mockCache.getSimple.mockResolvedValue(JSON.stringify(rules));
      const result = await service.getProductRules('product-1');
      expect(result).toEqual(rules);
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from db and cache when not cached', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      const rulesJson = { zones: [{ id: 'z1', label: 'Front', type: 'text', x: 0, y: 0, width: 100, height: 50 }] };
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        rulesJson,
        brandId: 'b1',
        name: 'Product',
      });
      const result = await service.getProductRules('product-1');
      expect(result).toEqual(rulesJson);
      expect(mockCache.setSimple).toHaveBeenCalledWith(
        'product_rules:product-1',
        expect.any(String),
        3600,
      );
    });

    it('should return null when product has no rules', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        rulesJson: null,
        brandId: 'b1',
        name: 'Product',
      });
      const result = await service.getProductRules('product-1');
      expect(result).toBeNull();
    });
  });

  describe('updateProductRules', () => {
    it('should update and invalidate cache', async () => {
      const rules: ProductRules = {
        zones: [
          {
            id: 'z1',
            label: 'Front',
            type: 'text',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
          },
        ],
      };
      mockPrisma.product.update.mockResolvedValue({
        id: 'product-1',
        rulesJson: rules,
      });
      const result = await service.updateProductRules('product-1', rules);
      expect(result).toEqual(rules);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { rulesJson: rules },
        select: { id: true, rulesJson: true },
      });
      expect(mockCache.delSimple).toHaveBeenCalledWith('product_rules:product-1');
    });

    it('should throw BadRequestException when zones missing', async () => {
      await expect(
        service.updateProductRules('product-1', {} as ProductRules),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when zone type invalid', async () => {
      const invalidRules = {
        zones: [
          {
            id: 'z1',
            label: 'Z',
            type: 'invalid_type' as any,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
          },
        ],
      };
      await expect(
        service.updateProductRules('product-1', invalidRules),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateDesignOptions', () => {
    it('should return valid when required zone has options', async () => {
      const zone: ProductZone = {
        id: 'z1',
        label: 'Text',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        constraints: { required: true },
      };
      const context: ZoneValidationContext = {
        productId: 'prod-1',
        brandId: 'brand-1',
        rules: { zones: [zone], compatibilityRules: [], globalConstraints: undefined },
        options: { zones: { z1: { text: 'Hello' } } },
      };
      const result = await service.validateDesignOptions(context);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when required zone missing', async () => {
      const zone: ProductZone = {
        id: 'z1',
        label: 'Text',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        constraints: { required: true },
      };
      const context: ZoneValidationContext = {
        productId: 'prod-1',
        brandId: 'brand-1',
        rules: { zones: [zone], compatibilityRules: [], globalConstraints: undefined },
        options: { zones: {} },
      };
      const result = await service.validateDesignOptions(context);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'ZONE_REQUIRED')).toBe(true);
    });
  });

  describe('getRulesUsageStats', () => {
    it('should return stats for product and period', async () => {
      mockCache.getSimple.mockResolvedValue(null);
      mockPrisma.design.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { status: 3 } },
        { status: 'DRAFT', _count: { status: 2 } },
      ]);
      mockPrisma.order.count.mockResolvedValue(5);
      const result = await service.getRulesUsageStats('product-1', 'week');
      expect(result.period).toBe('week');
      expect(result.orders).toBe(5);
      expect(result.designs).toBeDefined();
      expect(mockCache.setSimple).toHaveBeenCalled();
    });
  });
});
