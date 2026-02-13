import { Test, TestingModule } from '@nestjs/testing';
import { AIStudioService } from './ai-studio.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BudgetService } from '@/libs/budgets/budget.service';
import { AIStudioQueueService } from './ai-studio-queue.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AIGenerationType } from '../interfaces/ai-studio.interface';
import { MeshyProviderService } from './meshy-provider.service';
import { RunwayProviderService } from './runway-provider.service';
import { PlansService } from '@/modules/plans/plans.service';

describe('AIStudioService', () => {
  let service: AIStudioService;
  let prisma: jest.Mocked<PrismaService>;
  let budgetService: jest.Mocked<BudgetService>;
  let queueService: jest.Mocked<AIStudioQueueService>;

  const mockPrisma = {
    aIGeneration: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    aICollection: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    aIVersion: {
      findMany: jest.fn(),
    },
    promptTemplate: {
      findMany: jest.fn(),
    },
    userQuota: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    aICost: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    design: {
      findMany: jest.fn(),
    },
  };

  const mockBudgetService = {
    checkBudget: jest.fn(),
    enforceBudget: jest.fn(),
  };

  const mockQueueService = {
    queueGeneration: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'sk-test-key';
      return null;
    }),
  };

  const mockMeshyProvider = { generate: jest.fn() };
  const mockRunwayProvider = { generate: jest.fn() };
  const mockPlansService = { enforceDesignLimit: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIStudioService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: AIStudioQueueService, useValue: mockQueueService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MeshyProviderService, useValue: mockMeshyProvider },
        { provide: RunwayProviderService, useValue: mockRunwayProvider },
        { provide: PlansService, useValue: mockPlansService },
      ],
    }).compile();

    service = module.get<AIStudioService>(AIStudioService);
    prisma = module.get(PrismaService);
    budgetService = module.get(BudgetService);
    queueService = module.get(AIStudioQueueService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('generate', () => {
    const mockUserId = 'user-123';
    const mockBrandId = 'brand-123';
    const mockPrompt = 'A beautiful sunset over mountains';
    const mockModel = 'stable-diffusion-xl';
    const mockParameters = { quality: 'high' as const };

    it('should create a generation and queue it', async () => {
      mockBudgetService.checkBudget.mockResolvedValue(true);
      mockPrisma.userQuota.findUnique.mockResolvedValue({
        userId: mockUserId,
        monthlyLimit: 100,
        monthlyUsed: 10,
        costLimitCents: 10000,
        costUsedCents: 500,
        resetAt: new Date(),
      });
      
      const mockGeneration = {
        id: 'gen-123',
        type: 'IMAGE_2D',
        prompt: mockPrompt,
        negativePrompt: null,
        model: mockModel,
        provider: 'stability',
        parameters: mockParameters,
        status: 'PENDING',
        resultUrl: null,
        thumbnailUrl: null,
        credits: 3,
        costCents: 12,
        duration: null,
        quality: null,
        error: null,
        userId: mockUserId,
        brandId: mockBrandId,
        parentGenerationId: null,
        createdAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      };

      mockPrisma.aIGeneration.create.mockResolvedValue(mockGeneration);
      mockQueueService.queueGeneration.mockResolvedValue(undefined);

      const result = await service.generate(
        mockUserId,
        mockBrandId,
        AIGenerationType.IMAGE_2D,
        mockPrompt,
        mockModel,
        mockParameters,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('gen-123');
      expect(result.status).toBe('PENDING');
      expect(mockBudgetService.checkBudget).toHaveBeenCalled();
      expect(mockPrisma.aIGeneration.create).toHaveBeenCalled();
      expect(mockQueueService.queueGeneration).toHaveBeenCalled();
    });

    it('should throw BadRequestException if budget is insufficient', async () => {
      mockBudgetService.checkBudget.mockResolvedValue(false);

      await expect(
        service.generate(
          mockUserId,
          mockBrandId,
          AIGenerationType.IMAGE_2D,
          mockPrompt,
          mockModel,
          mockParameters,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user quota is exceeded', async () => {
      mockBudgetService.checkBudget.mockResolvedValue(true);
      mockPrisma.userQuota.findUnique.mockResolvedValue(null);

      await expect(
        service.generate(
          mockUserId,
          mockBrandId,
          AIGenerationType.IMAGE_2D,
          mockPrompt,
          mockModel,
          mockParameters,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGenerations', () => {
    it('should return generations with pagination', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          type: 'IMAGE_2D',
          prompt: 'test prompt',
          negativePrompt: null,
          model: 'dall-e-3',
          provider: 'openai',
          parameters: {},
          status: 'COMPLETED',
          resultUrl: 'https://example.com/image.png',
          thumbnailUrl: null,
          credits: 2,
          costCents: 12,
          duration: 5,
          quality: 95,
          error: null,
          userId: 'user-123',
          brandId: 'brand-123',
          parentGenerationId: null,
          createdAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.aIGeneration.findMany.mockResolvedValue(mockGenerations);
      mockPrisma.aIGeneration.count.mockResolvedValue(1);

      const result = await service.getGenerations('user-123', 'brand-123', {
        limit: 10,
        offset: 0,
      });

      expect(result.generations).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.generations[0].id).toBe('gen-1');
    });
  });

  describe('getModels', () => {
    it('should return available AI models with stats', async () => {
      mockPrisma.aIGeneration.groupBy.mockResolvedValue([
        {
          model: 'stable-diffusion-xl',
          _count: { id: 100 },
          _avg: { costCents: 800, duration: 4, quality: 92 },
          _sum: { costCents: 80000 },
        },
      ]);

      const result = await service.getModels();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('provider');
    });
  });

  describe('getStats', () => {
    it('should return usage statistics for a brand', async () => {
      mockPrisma.aIGeneration.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { id: 50 } },
        { status: 'FAILED', _count: { id: 5 } },
      ]);
      mockPrisma.aIGeneration.count.mockResolvedValue(55);
      mockPrisma.aIGeneration.findMany.mockResolvedValue([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'FAILED' },
      ]);
      mockPrisma.aIGeneration.aggregate.mockResolvedValue({
        _sum: { credits: 150, costCents: 5500 },
      });

      const result = await service.getStats('brand-123', { period: 'week' });

      expect(result).toBeDefined();
      expect(result.total).toBe(55);
      expect(result.byStatus).toBeDefined();
      expect(result.totalCreditsUsed).toBeDefined();
    });
  });

  describe('compareModels', () => {
    it('should compare two models and return winner', async () => {
      mockPrisma.aIGeneration.aggregate
        .mockResolvedValueOnce({
          _avg: { costCents: 800, duration: 4, quality: 92 },
          _count: { id: 100 },
          _sum: { costCents: 80000 },
        })
        .mockResolvedValueOnce({
          _avg: { costCents: 1200, duration: 3, quality: 95 },
          _count: { id: 80 },
          _sum: { costCents: 96000 },
        });

      const result = await service.compareModels(
        'stable-diffusion-xl',
        'dall-e-3',
        'quality',
      );

      expect(result).toBeDefined();
      expect(result.model1).toBe('stable-diffusion-xl');
      expect(result.model2).toBe('dall-e-3');
      expect(result.winner).toBeDefined();
      expect(result.insight).toBeDefined();
    });
  });

  describe('optimizePrompt', () => {
    it('should use fallback when OpenAI API key is not configured', async () => {
      // Override config to return empty key (use any to bypass strict mock typing)
      mockConfigService.get.mockImplementation(((key: string) => {
        if (key === 'OPENAI_API_KEY') return '';
        return null;
      }) as any);

      // Recreate service with new config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AIStudioService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: BudgetService, useValue: mockBudgetService },
          { provide: AIStudioQueueService, useValue: mockQueueService },
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: MeshyProviderService, useValue: mockMeshyProvider },
          { provide: RunwayProviderService, useValue: mockRunwayProvider },
          { provide: PlansService, useValue: mockPlansService },
        ],
      }).compile();

      const serviceWithNoKey = module.get<AIStudioService>(AIStudioService);
      
      const result = await serviceWithNoKey.optimizePrompt('a cat');

      expect(result).toBeDefined();
      expect(result.original).toBe('a cat');
      expect(result.optimized).toContain('a cat');
      expect(result.before).toBeDefined();
      expect(result.after).toBeDefined();
    });
  });

  describe('getCollections', () => {
    it('should return user collections', async () => {
      mockPrisma.aICollection.findMany.mockResolvedValue([
        {
          id: 'col-1',
          name: 'My Collection',
          description: 'Test collection',
          isShared: false,
          userId: 'user-123',
          brandId: 'brand-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { generations: 5 },
        },
      ]);

      const result = await service.getCollections('user-123', 'brand-123');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Collection');
      expect(result[0].generationCount).toBe(5);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', async () => {
      const mockCollection = {
        id: 'col-new',
        name: 'New Collection',
        description: 'A new collection',
        isShared: false,
        userId: 'user-123',
        brandId: 'brand-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.aICollection.create.mockResolvedValue(mockCollection);

      const result = await service.createCollection('user-123', 'brand-123', {
        name: 'New Collection',
        description: 'A new collection',
        isShared: false,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('New Collection');
      expect(result.generationCount).toBe(0);
    });
  });

  describe('getTemplate', () => {
    it('should return a specific template', async () => {
      mockPrisma.aIGeneration.findFirst.mockResolvedValue({
        id: 'tpl-1',
        type: 'TEMPLATE',
        prompt: 'Template prompt',
        model: 'template-generator',
        provider: 'luneo',
        parameters: { name: 'My Template', category: 'general' },
        status: 'COMPLETED',
        thumbnailUrl: 'https://example.com/thumb.png',
        resultUrl: 'https://example.com/preview.png',
        credits: 0,
        costCents: 0,
        userId: 'user-123',
        brandId: 'brand-123',
        createdAt: new Date(),
      });

      const result = await service.getTemplate('tpl-1', 'brand-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('tpl-1');
      expect(result.name).toBe('My Template');
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrisma.aIGeneration.findFirst.mockResolvedValue(null);

      await expect(
        service.getTemplate('nonexistent', 'brand-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateCredits', () => {
    it('should calculate credits for IMAGE_2D', () => {
      const credits = service.calculateCredits(
        AIGenerationType.IMAGE_2D,
        'stable-diffusion-xl',
        { quality: 'standard' },
      );

      expect(credits).toBeGreaterThan(0);
    });

    it('should increase credits for high quality', () => {
      const standardCredits = service.calculateCredits(
        AIGenerationType.IMAGE_2D,
        'stable-diffusion-xl',
        { quality: 'standard' },
      );

      const highCredits = service.calculateCredits(
        AIGenerationType.IMAGE_2D,
        'stable-diffusion-xl',
        { quality: 'high' },
      );

      expect(highCredits).toBeGreaterThan(standardCredits);
    });

    it('should increase credits for ultra quality', () => {
      const highCredits = service.calculateCredits(
        AIGenerationType.IMAGE_2D,
        'stable-diffusion-xl',
        { quality: 'high' },
      );

      const ultraCredits = service.calculateCredits(
        AIGenerationType.IMAGE_2D,
        'stable-diffusion-xl',
        { quality: 'ultra' },
      );

      expect(ultraCredits).toBeGreaterThan(highCredits);
    });
  });

  describe('getEstimation', () => {
    it('should return cost and credits estimation', async () => {
      const result = await service.getEstimation(
        AIGenerationType.IMAGE_2D,
        'dall-e-3',
        { quality: 'high' },
        'A beautiful landscape',
      );

      expect(result).toBeDefined();
      expect(result.costCents).toBeGreaterThan(0);
      expect(result.credits).toBeGreaterThan(0);
    });
  });
});
