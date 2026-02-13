/**
 * DesignsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DesignsService } from './designs.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { HttpService } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bull';
import { DesignStatus, UserRole } from '@prisma/client';
import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { PlansService } from '@/modules/plans/plans.service';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';
import { CreditsService } from '@/libs/credits/credits.service';

describe('DesignsService', () => {
  let service: DesignsService;
  const mockPrisma: Record<string, any> = {
    product: { findUnique: jest.fn() },
    design: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: { findMany: jest.fn() },
    designVersion: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockAiQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
  };

  const mockStorageService = {
    uploadBuffer: jest.fn().mockResolvedValue('https://storage.example/file.pdf'),
  };

  const mockHttpService = {
    get: jest.fn().mockReturnValue(
      of({ data: Buffer.from('image-data'), status: 200 }),
    ),
  };

  const mockPlansService = {
    enforceDesignLimit: jest.fn().mockResolvedValue(undefined),
  };

  const mockQuotasService = {
    enforceQuota: jest.fn().mockResolvedValue(undefined),
  };

  const mockUsageTrackingService = {
    trackDesignCreated: jest.fn().mockResolvedValue(undefined),
  };

  const mockCreditsService = {
    deductCredits: jest.fn().mockResolvedValue(undefined),
    getBalance: jest.fn().mockResolvedValue(100),
  };

  const brandUser = {
    id: 'user-1',
    role: UserRole.BRAND_ADMIN as UserRole,
    brandId: 'brand-1',
  };

  const platformAdmin = {
    id: 'admin-1',
    role: UserRole.PLATFORM_ADMIN as UserRole,
    brandId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesignsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('ai-generation'), useValue: mockAiQueue },
        { provide: StorageService, useValue: mockStorageService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: PlansService, useValue: mockPlansService },
        { provide: QuotasService, useValue: mockQuotasService },
        { provide: UsageTrackingService, useValue: mockUsageTrackingService },
        { provide: CreditsService, useValue: mockCreditsService },
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            FRONTEND_URL: 'http://localhost:3000',
            APP_URL: 'http://localhost:3000',
            NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          };
          return config[key] ?? undefined;
        }) } },
      ],
    }).compile();

    service = module.get<DesignsService>(DesignsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create design and queue AI generation', async () => {
      const product = {
        id: 'prod-1',
        brandId: 'brand-1',
        brand: { id: 'brand-1', name: 'Brand' },
      };
      mockPrisma.product.findUnique.mockResolvedValue(product);
      const createdDesign = {
        id: 'design-1',
        prompt: 'A red logo',
        options: null,
        status: DesignStatus.PENDING,
        userId: 'user-1',
        brandId: 'brand-1',
        productId: 'prod-1',
        createdAt: new Date(),
        product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
        brand: { id: 'brand-1', name: 'Brand' },
      };
      mockPrisma.design.create.mockResolvedValue(createdDesign);

      const result = await service.create(
        { productId: 'prod-1', prompt: 'A red logo' },
        brandUser as any,
      );

      expect(result.id).toBe('design-1');
      expect(result.prompt).toBe('A red logo');
      expect(mockPrisma.design.create).toHaveBeenCalled();
      expect(mockAiQueue.add).toHaveBeenCalledWith('generate-design', {
        designId: 'design-1',
        prompt: 'A red logo',
        options: undefined,
        userId: 'user-1',
        brandId: 'brand-1',
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ productId: 'nonexistent', prompt: 'x' }, brandUser as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create({ productId: 'nonexistent', prompt: 'x' }, brandUser as any),
      ).rejects.toThrow('Product not found');
      expect(mockPrisma.design.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has no access to product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        brandId: 'other-brand',
        brand: {},
      });

      await expect(
        service.create({ productId: 'prod-1', prompt: 'x' }, brandUser as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create({ productId: 'prod-1', prompt: 'x' }, brandUser as any),
      ).rejects.toThrow('Access denied to this product');
    });
  });

  describe('getOrdersByDesign', () => {
    it('should return orders for design', async () => {
      const orders = [
        {
          id: 'ord-1',
          status: 'PAID',
          designId: 'design-1',
          orderNumber: 'ORD-1',
          createdAt: new Date(),
        },
      ];
      mockPrisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrdersByDesign('design-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('ord-1');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated designs for user brand', async () => {
      const designs = [
        {
          id: 'd1',
          name: null,
          description: null,
          prompt: 'Prompt',
          status: DesignStatus.COMPLETED,
          previewUrl: null,
          imageUrl: null,
          userId: 'user-1',
          brandId: 'brand-1',
          productId: 'prod-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          product: { id: 'prod-1', name: 'T-Shirt', price: 29.99 },
          brand: { id: 'brand-1', name: 'Brand', logo: null },
        },
      ];
      mockPrisma.design.findMany.mockResolvedValue(designs);
      mockPrisma.design.count.mockResolvedValue(1);

      const result = await service.findAll(brandUser as any, { page: 1, limit: 50 });

      expect(result.designs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.design.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: 'brand-1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return design when found and user has access', async () => {
      const design = {
        id: 'design-1',
        name: null,
        description: null,
        prompt: 'Prompt',
        options: null,
        status: DesignStatus.COMPLETED,
        previewUrl: null,
        highResUrl: null,
        imageUrl: null,
        renderUrl: null,
        metadata: null,
        designData: null,
        canvasWidth: null,
        canvasHeight: null,
        canvasBackgroundColor: null,
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        blockedByClaimId: null,
        userId: 'user-1',
        brandId: 'brand-1',
        productId: 'prod-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {},
        brand: {},
        user: {},
      };
      mockPrisma.design.findUnique.mockResolvedValue(design);

      const result = await service.findOne('design-1', brandUser as any);

      expect(result).toEqual(design);
      expect(result.id).toBe('design-1');
    });

    it('should throw NotFoundException when design not found', async () => {
      mockPrisma.design.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', brandUser as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('nonexistent', brandUser as any),
      ).rejects.toThrow('Design not found');
    });

    it('should throw ForbiddenException when user has no access', async () => {
      mockPrisma.design.findUnique.mockResolvedValue({
        id: 'design-1',
        brandId: 'other-brand',
        userId: 'other',
        product: {},
        brand: {},
        user: {},
      } as any);

      await expect(
        service.findOne('design-1', brandUser as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne('design-1', brandUser as any),
      ).rejects.toThrow('Access denied to this design');
    });
  });

  describe('update', () => {
    it('should update design when user has access', async () => {
      const existingDesign = {
        id: 'design-1',
        brandId: 'brand-1',
        isBlocked: false,
        product: {},
        brand: {},
        user: {},
      } as any;
      mockPrisma.design.findUnique.mockResolvedValue(existingDesign);
      const updated = {
        id: 'design-1',
        name: 'Updated',
        description: null,
        status: DesignStatus.COMPLETED,
        previewUrl: null,
        imageUrl: null,
        userId: 'user-1',
        brandId: 'brand-1',
        productId: 'prod-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.design.update.mockResolvedValue(updated);

      const result = await service.update(
        'design-1',
        { name: 'Updated' },
        brandUser as any,
      );

      expect(result.name).toBe('Updated');
      expect(mockPrisma.design.update).toHaveBeenCalledWith({
        where: { id: 'design-1' },
        data: expect.objectContaining({ name: 'Updated' }),
        select: expect.any(Object),
      });
    });
  });

  describe('delete', () => {
    it('should delete design when user has access', async () => {
      const design = {
        id: 'design-1',
        brandId: 'brand-1',
        isBlocked: false,
        product: {},
        brand: {},
        user: {},
      } as any;
      mockPrisma.design.findUnique.mockResolvedValue(design);
      mockPrisma.design.delete.mockResolvedValue(design);

      const result = await service.delete('design-1', brandUser as any);

      expect(result.success).toBe(true);
      expect(mockPrisma.design.delete).toHaveBeenCalledWith({
        where: { id: 'design-1' },
      });
    });

    it('should throw ForbiddenException when design is blocked and user is not platform admin', async () => {
      mockPrisma.design.findUnique.mockResolvedValue({
        id: 'design-1',
        brandId: 'brand-1',
        isBlocked: true,
        product: {},
        brand: {},
        user: {},
      } as any);

      await expect(
        service.delete('design-1', brandUser as any),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.delete('design-1', brandUser as any),
      ).rejects.toThrow(/blocked due to an IP claim/);
      expect(mockPrisma.design.delete).not.toHaveBeenCalled();
    });
  });

  describe('createVersion', () => {
    it('should create a version snapshot for a design', async () => {
      const designForFindOne = {
        id: 'design-1',
        brandId: 'brand-1',
        isBlocked: false,
        product: {},
        brand: {},
        user: {},
      } as any;
      mockPrisma.design.findUnique
        .mockResolvedValueOnce(designForFindOne)
        .mockResolvedValueOnce({
          name: 'Design',
          description: null,
          prompt: 'Prompt',
          options: null,
          status: DesignStatus.COMPLETED,
          previewUrl: null,
          highResUrl: null,
          imageUrl: null,
          renderUrl: null,
          metadata: null,
          designData: null,
          canvasWidth: null,
          canvasHeight: null,
          canvasBackgroundColor: null,
        });
      mockPrisma.designVersion.findFirst.mockResolvedValue({ versionNumber: 1 });
      const createdVersion = {
        id: 'ver-1',
        versionNumber: 2,
        name: 'v2',
        description: null,
        previewUrl: null,
        highResUrl: null,
        imageUrl: null,
        isAutoSave: false,
        createdAt: new Date(),
      };
      mockPrisma.designVersion.create.mockResolvedValue(createdVersion);

      const result = await service.createVersion(
        'design-1',
        { name: 'v2' },
        brandUser as any,
      );

      expect(result.id).toBe('ver-1');
      expect(result.version_number).toBe(2);
      expect(result.name).toBe('v2');
      expect(mockPrisma.designVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            designId: 'design-1',
            versionNumber: 2,
            name: 'v2',
            isAutoSave: false,
            createdBy: 'user-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException when design not found for createVersion', async () => {
      mockPrisma.design.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion('nonexistent', {}, brandUser as any),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.designVersion.create).not.toHaveBeenCalled();
    });
  });

  describe('share', () => {
    it('should generate share token and return share URL', async () => {
      const design = {
        id: 'design-1',
        name: 'My Design',
        brandId: 'brand-1',
        metadata: null,
        isBlocked: false,
        product: {},
        brand: {},
        user: {},
      } as any;
      mockPrisma.design.findUnique.mockResolvedValue(design);
      mockPrisma.design.update.mockResolvedValue({
        id: 'design-1',
        name: 'My Design',
        metadata: {
          shareToken: 'abc123',
          shareTokenExpiresAt: new Date().toISOString(),
          sharedAt: new Date().toISOString(),
        },
      });

      const result = await service.share('design-1', { expiresInDays: 7 }, brandUser as any);

      expect(result.shareToken).toBeDefined();
      expect(result.shareUrl).toContain('/designs/shared/');
      expect(result.expiresAt).toBeDefined();
      expect(result.design.id).toBe('design-1');
      expect(mockPrisma.design.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'design-1' },
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              shareToken: expect.any(String),
              shareTokenExpiresAt: expect.any(String),
              sharedAt: expect.any(String),
            }),
          }),
        }),
      );
    });

    it('should throw ForbiddenException when design is blocked', async () => {
      mockPrisma.design.findUnique.mockResolvedValue({
        id: 'design-1',
        brandId: 'brand-1',
        isBlocked: true,
        product: {},
        brand: {},
        user: {},
      } as any);

      await expect(
        service.share('design-1', {}, brandUser as any),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.design.update).not.toHaveBeenCalled();
    });
  });

  describe('getShared', () => {
    it('should throw NotFoundException when shared design not found', async () => {
      mockPrisma.design.findMany.mockResolvedValue([]);

      await expect(service.getShared('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getShared('invalid-token')).rejects.toThrow(
        'Shared design not found',
      );
    });

    it('should throw BadRequestException when share link expired', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      mockPrisma.design.findMany.mockResolvedValue([
        {
          id: 'd1',
          name: 'Design',
          description: null,
          previewUrl: null,
          highResUrl: null,
          imageUrl: null,
          metadata: { shareToken: 'token-1', shareTokenExpiresAt: pastDate },
          createdAt: new Date(),
          product: {},
          brand: {},
        },
      ]);

      await expect(service.getShared('token-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getShared('token-1')).rejects.toThrow(
        'Shared design link has expired',
      );
    });
  });
});
