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

      conversationService.getOrCreate.mockResolvedValue({
        id: conversationId,
      });

      llmRouterService.chat.mockResolvedValue({
        content: 'Voici votre analyse...',
        provider: 'openai' as any,
        model: 'gpt-3.5-turbo',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
        latencyMs: 500,
      });

      conversationService.addMessage.mockResolvedValue(undefined);
      conversationService.getHistory.mockResolvedValue([]);

      // Act
      const result = await service.chat({ brandId, message });

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(conversationService.getOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          brandId,
          agentType: 'luna',
        }),
      );
      expect(llmRouterService.chat).toHaveBeenCalled();
      expect(conversationService.addMessage).toHaveBeenCalled();
    });

    it('should throw error when conversation creation fails', async () => {
      // Arrange
      const brandId = 'brand-123';
      const message = 'Test';

      conversationService.getOrCreate.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.chat({ brandId, message })).rejects.toThrow();
    });
  });

  describe('chat with sales analysis intent', () => {
    it('should handle sales analysis requests', async () => {
      // Arrange
      const brandId = 'brand-123';
      const message = 'Analyse mes ventes du mois dernier';

      conversationService.getOrCreate.mockResolvedValue({ id: 'conv-123' });
      conversationService.getHistory.mockResolvedValue([]);
      conversationService.addMessage.mockResolvedValue(undefined);

      // Mock Prisma queries properly for Prisma 5.x
      (prismaService.order.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        {
          id: 'order-1',
          totalCents: 10000,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'order-2',
          totalCents: 20000,
          createdAt: new Date('2024-01-20'),
        },
      ]);

      llmRouterService.chat.mockResolvedValue({
        content: 'Voici votre analyse des ventes...',
        provider: 'openai' as any,
        model: 'gpt-3.5-turbo',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
        latencyMs: 500,
      });

      // Act
      const result = await service.chat({ brandId, message });

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('chat with product recommendation intent', () => {
    it('should handle product recommendation requests', async () => {
      // Arrange
      const brandId = 'brand-123';
      const message = 'Quels produits me recommandes-tu ?';

      conversationService.getOrCreate.mockResolvedValue({ id: 'conv-123' });
      conversationService.getHistory.mockResolvedValue([]);
      conversationService.addMessage.mockResolvedValue(undefined);

      // Mock Prisma queries properly for Prisma 5.x
      (prismaService.product.findMany as jest.Mock) = jest.fn().mockResolvedValue([
        { id: 'prod-1', name: 'Product 1' },
        { id: 'prod-2', name: 'Product 2' },
      ]);

      llmRouterService.chat.mockResolvedValue({
        content: 'Je vous recommande ces produits...',
        provider: 'openai' as any,
        model: 'gpt-3.5-turbo',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
        latencyMs: 500,
      });

      // Act
      const result = await service.chat({ brandId, message });

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });
});
