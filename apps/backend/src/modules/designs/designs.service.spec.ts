/**
 * DesignsService - Tests unitaires
 * Tests pour la gestion des designs
 */

import { createMockPrismaService, testFixtures } from '@/common/test/test-setup';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DesignStatus, UserRole } from '@prisma/client';
import { Queue } from 'bullmq';
import { DesignsService } from './designs.service';

describe('DesignsService', () => {
  let service: DesignsService;
  let prismaService: jest.Mocked<PrismaService>;
  let aiQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_123' } as any),
    } as unknown as Queue;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesignsService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: getQueueToken('ai-generation'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<DesignsService>(DesignsService);
    prismaService = module.get(PrismaService);
    aiQueue = module.get(getQueueToken('ai-generation')) as jest.Mocked<Queue>;
    
    // Ensure the mock is properly set up
    (aiQueue.add as jest.Mock).mockResolvedValue({ id: 'job_123' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      productId: 'prod_123',
      prompt: 'Create a beautiful design',
      options: { style: 'modern' },
    };

    it('should create design successfully', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: UserRole.CONSUMER };
      (prismaService.product.findUnique as any).mockResolvedValue({
        ...testFixtures.product,
        brand: testFixtures.brand,
      } as any);
      (prismaService.design.create as any).mockResolvedValue({
        ...testFixtures.design,
        ...createDto,
        product: testFixtures.product,
        brand: testFixtures.brand,
      } as any);

      // Act
      const result = await service.create(createDto, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.prompt).toBe(createDto.prompt);
      expect(prismaService.design.create).toHaveBeenCalled();
      expect(aiQueue.add).toHaveBeenCalledWith('generate-design', expect.any(Object));
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.product.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, currentUser)).rejects.toThrow(NotFoundException);
      expect(prismaService.design.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not have access to product brand', async () => {
      // Arrange
      const currentUser = {
        ...testFixtures.currentUser,
        role: UserRole.CONSUMER,
        brandId: 'different_brand',
      };
      (prismaService.product.findUnique as any).mockResolvedValue({
        ...testFixtures.product,
        brand: testFixtures.brand,
      } as any);

      // Act & Assert
      await expect(service.create(createDto, currentUser)).rejects.toThrow(ForbiddenException);
      expect(prismaService.design.create).not.toHaveBeenCalled();
    });

    it('should add design to AI generation queue', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.product.findUnique as any).mockResolvedValue({
        ...testFixtures.product,
        brand: testFixtures.brand,
      } as any);
      (prismaService.design.create as any).mockResolvedValue({
        ...testFixtures.design,
        id: 'design_123',
      } as any);

      // Act
      await service.create(createDto, currentUser);

      // Assert
      expect(aiQueue.add).toHaveBeenCalledWith(
        'generate-design',
        expect.objectContaining({
          designId: 'design_123',
          prompt: createDto.prompt,
          userId: currentUser.id,
          brandId: testFixtures.brand.id,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return design by id', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.design.findUnique as any).mockResolvedValue({
        ...testFixtures.design,
        product: testFixtures.product,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);

      // Act
      const result = await service.findOne('design_123', currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('design_123');
      expect(prismaService.design.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'design_123' },
        }),
      );
    });

    it('should throw NotFoundException if design not found', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.design.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid_id', currentUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      // Arrange
      const currentUser = {
        ...testFixtures.currentUser,
        role: UserRole.CONSUMER,
        brandId: 'different_brand',
      };
      (prismaService.design.findUnique as any).mockResolvedValue({
        ...testFixtures.design,
        brandId: 'brand_123',
      } as any);

      // Act & Assert
      await expect(service.findOne('design_123', currentUser)).rejects.toThrow(ForbiddenException);
    });

    it('should use select for optimization', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.design.findUnique as any).mockResolvedValue({
        ...testFixtures.design,
        product: testFixtures.product,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);

      // Act
      await service.findOne('design_123', currentUser);

      // Assert
      const callArgs = (prismaService.design.findUnique as any).mock.calls[0][0];
      expect(callArgs.select).toBeDefined();
      expect(callArgs.include).toBeUndefined();
    });
  });

  describe('upgradeToHighRes', () => {
    it('should add design to high-res generation queue', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.design.findUnique as any).mockResolvedValue({
        ...testFixtures.design,
        id: 'design_123',
        status: DesignStatus.COMPLETED,
        prompt: 'Test prompt',
        options: { test: 'options' },
        product: testFixtures.product,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);

      // Act
      const result = await service.upgradeToHighRes('design_123', currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('High-res generation started');
      expect(aiQueue.add).toHaveBeenCalledWith('generate-high-res', {
        designId: 'design_123',
        prompt: 'Test prompt',
        options: { test: 'options' },
        userId: currentUser.id,
      });
      expect(prismaService.design.findUnique).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if design is not completed', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.design.findUnique as any).mockResolvedValue({
        ...testFixtures.design,
        status: DesignStatus.PENDING,
        product: testFixtures.product,
        brand: testFixtures.brand,
        user: testFixtures.user,
      } as any);

      // Act & Assert
      await expect(
        service.upgradeToHighRes('design_123', currentUser),
      ).rejects.toThrow(ForbiddenException);
      expect(aiQueue.add).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if design not found', async () => {
      // Arrange
      const currentUser = { ...testFixtures.currentUser, role: testFixtures.currentUser.role as UserRole };
      (prismaService.design.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.upgradeToHighRes('invalid_id', currentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

