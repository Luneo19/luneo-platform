/**
 * LunaService - Tests unitaires
 * Tests pour l'agent Luna (B2B)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LunaService } from './luna.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService } from '../services/llm-router.service';
import { ConversationService } from '../services/conversation.service';
import { AgentMemoryService } from '../services/agent-memory.service';
import { createTestingModule, testFixtures } from '@/common/test/test-setup';

describe('LunaService', () => {
  let service: LunaService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<SmartCacheService>;
  let llmRouterService: jest.Mocked<LLMRouterService>;
  let conversationService: jest.Mocked<ConversationService>;
  let memoryService: jest.Mocked<AgentMemoryService>;

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule([
      LunaService,
      LLMRouterService,
      ConversationService,
      AgentMemoryService,
    ]);

    service = module.get<LunaService>(LunaService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
    llmRouterService = module.get(LLMRouterService);
    conversationService = module.get(ConversationService);
    memoryService = module.get(AgentMemoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('should process a chat message and return response', async () => {
      // Arrange
      const brandId = 'brand-123';
      const message = 'Analyse mes ventes';
      const conversationId = 'conv-123';

      conversationService.getOrCreateConversation.mockResolvedValue({
        id: conversationId,
        brandId,
        agentType: 'luna',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      llmRouterService.chat.mockResolvedValue({
        content: 'Voici votre analyse...',
        provider: 'openai' as any,
        model: 'gpt-3.5-turbo',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
        latencyMs: 500,
      });

      conversationService.addMessage.mockResolvedValue(undefined);

      // Act
      const result = await service.chat(brandId, message);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toContain('analyse');
      expect(conversationService.getOrCreateConversation).toHaveBeenCalledWith(
        brandId,
        'luna',
      );
      expect(llmRouterService.chat).toHaveBeenCalled();
      expect(conversationService.addMessage).toHaveBeenCalled();
    });

    it('should throw error when conversation creation fails', async () => {
      // Arrange
      const brandId = 'brand-123';
      const message = 'Test';

      conversationService.getOrCreateConversation.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.chat(brandId, message)).rejects.toThrow();
    });
  });

  describe('analyzeSales', () => {
    it('should analyze sales data', async () => {
      // Arrange
      const brandId = 'brand-123';
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      prismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          totalAmount: 100,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'order-2',
          totalAmount: 200,
          createdAt: new Date('2024-01-20'),
        },
      ] as any);

      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      // Act
      const result = await service.analyzeSales(brandId, dateRange);

      // Assert
      expect(result).toBeDefined();
      expect(result.totalRevenue).toBe(300);
      expect(prismaService.order.findMany).toHaveBeenCalled();
    });
  });

  describe('recommendProducts', () => {
    it('should recommend products based on analytics', async () => {
      // Arrange
      const brandId = 'brand-123';

      prismaService.product.findMany.mockResolvedValue([
        { id: 'prod-1', name: 'Product 1' },
        { id: 'prod-2', name: 'Product 2' },
      ] as any);

      memoryService.getContext.mockResolvedValue({
        popularProducts: ['prod-1'],
      });

      // Act
      const result = await service.recommendProducts(brandId);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
