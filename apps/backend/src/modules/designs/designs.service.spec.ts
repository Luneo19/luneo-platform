import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AiQueueService } from '@/modules/ai/services/ai-queue.service';
import { PromptGuardService } from '@/modules/ai/services/prompt-guard.service';
import { PromptLocalizationService } from '@/modules/ai/services/prompt-localization.service';
import { UVReprojectorUtil } from './utils/uv-reprojector.util';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { UsdzConverterService } from './services/usdz-converter.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UserRole, DesignStatus } from '@prisma/client';
import type { User } from 'express';

describe('DesignsService', () => {
  let service: DesignsService;
  let prisma: PrismaService;
  let aiQueueService: AiQueueService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.USER,
    brandId: 'brand-123',
  };

  const mockProduct = {
    id: 'product-123',
    brandId: 'brand-123',
    brand: { id: 'brand-123', name: 'Test Brand' },
  };

  const mockDesign = {
    id: 'design-123',
    prompt: 'Test prompt',
    status: DesignStatus.COMPLETED,
    userId: 'user-123',
    brandId: 'brand-123',
    productId: 'product-123',
    options: {},
    metadata: {},
    product: mockProduct,
    brand: mockProduct.brand,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesignsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
            },
            design: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            asset: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AiQueueService,
          useValue: {
            enqueueDesign: jest.fn(),
            enqueueHighRes: jest.fn(),
          },
        },
        {
          provide: PromptGuardService,
          useValue: {
            enforcePolicies: jest.fn().mockReturnValue({ prompt: 'sanitized prompt' }),
          },
        },
        {
          provide: PromptLocalizationService,
          useValue: {
            normalizePrompt: jest.fn().mockResolvedValue({
              prompt: 'normalized prompt',
              originalLocale: 'en',
              targetLocale: 'en',
              translated: false,
            }),
          },
        },
        {
          provide: UVReprojectorUtil,
          useValue: {
            validateUVBBox: jest.fn().mockReturnValue({ valid: true, warnings: [] }),
            clampUVBBox: jest.fn().mockImplementation((bbox) => bbox),
            reprojectMask: jest.fn().mockResolvedValue(Buffer.from('test')),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn().mockResolvedValue('https://cloudinary.com/image.jpg'),
          },
        },
        {
          provide: UsdzConverterService,
          useValue: {
            convertDesignToUsdz: jest.fn().mockResolvedValue({
              usdzUrl: 'https://example.com/model.usdz',
              cacheKey: 'cache-key',
              optimized: true,
            }),
            getSignedUsdzUrl: jest.fn().mockResolvedValue('https://signed.example.com/model.usdz'),
          },
        },
      ],
    }).compile();

    service = module.get<DesignsService>(DesignsService);
    prisma = module.get<PrismaService>(PrismaService);
    aiQueueService = module.get<AiQueueService>(AiQueueService);
  });

  describe('create', () => {
    it('should create a design successfully', async () => {
      const createDto: CreateDesignDto = {
        productId: 'product-123',
        prompt: 'Test prompt',
        options: { style: 'realistic' },
      };

      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prisma.design, 'create').mockResolvedValue(mockDesign as any);
      jest.spyOn(aiQueueService, 'enqueueDesign').mockResolvedValue(undefined);

      const result = await service.create(createDto, mockUser);

      expect(result).toBeDefined();
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        include: { brand: true },
      });
      expect(prisma.design.create).toHaveBeenCalled();
      expect(aiQueueService.enqueueDesign).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const createDto: CreateDesignDto = {
        productId: 'non-existent',
        prompt: 'Test prompt',
      };

      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      const createDto: CreateDesignDto = {
        productId: 'product-123',
        prompt: 'Test prompt',
      };

      const differentBrandUser: User = {
        ...mockUser,
        brandId: 'different-brand',
      };

      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct as any);

      await expect(service.create(createDto, differentBrandUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a design if found and user has access', async () => {
      jest.spyOn(prisma.design, 'findUnique').mockResolvedValue(mockDesign as any);

      const result = await service.findOne('design-123', mockUser);

      expect(result).toEqual(mockDesign);
      expect(prisma.design.findUnique).toHaveBeenCalledWith({
        where: { id: 'design-123' },
        include: { product: true, brand: true, user: true },
      });
    });

    it('should throw NotFoundException if design does not exist', async () => {
      jest.spyOn(prisma.design, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      const differentBrandUser: User = {
        ...mockUser,
        brandId: 'different-brand',
      };

      jest.spyOn(prisma.design, 'findUnique').mockResolvedValue(mockDesign as any);

      await expect(service.findOne('design-123', differentBrandUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('upgradeToHighRes', () => {
    it('should upgrade design to high-res successfully', async () => {
      jest.spyOn(prisma.design, 'findUnique').mockResolvedValue(mockDesign as any);
      jest.spyOn(aiQueueService, 'enqueueHighRes').mockResolvedValue(undefined);

      const result = await service.upgradeToHighRes('design-123', mockUser);

      expect(result).toEqual({ message: 'High-res generation started' });
      expect(aiQueueService.enqueueHighRes).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if design is not completed', async () => {
      const pendingDesign = {
        ...mockDesign,
        status: DesignStatus.PENDING,
      };

      jest.spyOn(prisma.design, 'findUnique').mockResolvedValue(pendingDesign as any);

      await expect(service.upgradeToHighRes('design-123', mockUser)).rejects.toThrow(ForbiddenException);
    });
  });
});
