/**
 * Tests unitaires pour ContextManagerService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ContextManagerService } from '../context-manager.service';
import { LLMRouterService, LLMProvider, LLM_MODELS } from '../llm-router.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ConversationMessage } from '../conversation.service';

describe('ContextManagerService', () => {
  let service: ContextManagerService;
  let llmRouter: jest.Mocked<LLMRouterService>;
  let cache: jest.Mocked<SmartCacheService>;

  beforeEach(async () => {
    const mockLlmRouter = {
      chat: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextManagerService,
        {
          provide: LLMRouterService,
          useValue: mockLlmRouter,
        },
        {
          provide: SmartCacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<ContextManagerService>(ContextManagerService);
    llmRouter = module.get(LLMRouterService);
    cache = module.get(SmartCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('compressHistory', () => {
    it('should not compress if messages <= MAX_RECENT_MESSAGES', async () => {
      const messages: ConversationMessage[] = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      const result = await service.compressHistory(messages);

      expect(result.summary).toBe('');
      expect(result.recentMessages.length).toBe(10);
      expect(result.totalTokensSaved).toBe(0);
    });

    it('should compress if messages > MAX_RECENT_MESSAGES', async () => {
      const messages: ConversationMessage[] = Array.from({ length: 30 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      cache.get.mockResolvedValue(null);
      llmRouter.chat.mockResolvedValue({
        content: 'Summary of old messages',
        provider: LLMProvider.ANTHROPIC,
        model: LLM_MODELS.anthropic.CLAUDE_3_HAIKU,
        usage: {
          promptTokens: 200,
          completionTokens: 50,
          totalTokens: 250,
        },
        finishReason: 'stop',
        latencyMs: 300,
      });

      const result = await service.compressHistory(messages);

      expect(result.summary).toBe('Summary of old messages');
      expect(result.recentMessages.length).toBe(10);
      expect(result.totalTokensSaved).toBeGreaterThan(0);
    });

    it('should use cached summary if available', async () => {
      const messages: ConversationMessage[] = Array.from({ length: 30 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      cache.get.mockResolvedValue('Cached summary');

      const result = await service.compressHistory(messages);

      expect(result.summary).toBe('Cached summary');
      expect(llmRouter.chat).not.toHaveBeenCalled();
    });
  });

  describe('buildOptimizedContext', () => {
    it('should build context with summary and recent messages', () => {
      const compressed = {
        summary: 'Previous conversation summary',
        recentMessages: [
          { role: 'user' as const, content: 'Recent message 1' },
          { role: 'assistant' as const, content: 'Recent response 1' },
        ],
        totalTokensSaved: 500,
      };

      const messages = service.buildOptimizedContext(compressed, 'Current message');

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].role).toBe('system');
      expect(messages[messages.length - 1].content).toBe('Current message');
    });
  });
});
