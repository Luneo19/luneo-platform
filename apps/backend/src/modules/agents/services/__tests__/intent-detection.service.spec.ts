/**
 * Tests unitaires pour IntentDetectionService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { IntentDetectionService } from '../intent-detection.service';
import { LLMRouterService, LLMProvider, LLM_MODELS } from '../llm-router.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { AgentMetricsService } from '../agent-metrics.service';

describe('IntentDetectionService', () => {
  let service: IntentDetectionService;
  let llmRouter: jest.Mocked<LLMRouterService>;
  let cache: jest.Mocked<SmartCacheService>;
  let metrics: jest.Mocked<AgentMetricsService>;

  beforeEach(async () => {
    const mockLlmRouter = {
      chat: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      getSimple: jest.fn(),
      setSimple: jest.fn(),
    };

    const mockMetrics = {
      recordCacheHit: jest.fn(),
      recordCacheMiss: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentDetectionService,
        {
          provide: LLMRouterService,
          useValue: mockLlmRouter,
        },
        {
          provide: SmartCacheService,
          useValue: mockCache,
        },
        {
          provide: AgentMetricsService,
          useValue: mockMetrics,
        },
      ],
    }).compile();

    service = module.get<IntentDetectionService>(IntentDetectionService);
    llmRouter = module.get(LLMRouterService);
    cache = module.get(SmartCacheService);
    metrics = module.get(AgentMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectIntent', () => {
    it('should return cached result if available', async () => {
      const cachedResult = {
        intent: 'analyze_sales',
        confidence: 0.95,
        reasoning: 'Cached',
      };

      cache.getSimple.mockResolvedValue(cachedResult);

      const result = await service.detectIntent(
        'Show me sales data',
        'luna',
        ['analyze_sales', 'general_question'],
      );

      expect(result).toEqual(cachedResult);
      expect(metrics.recordCacheHit).toHaveBeenCalled();
      expect(llmRouter.chat).not.toHaveBeenCalled();
    });

    it('should call LLM if not cached', async () => {
      cache.getSimple.mockResolvedValue(null);
      llmRouter.chat.mockResolvedValue({
        content: JSON.stringify({
          intent: 'analyze_sales',
          confidence: 0.95,
          reasoning: 'User asked for sales data',
        }),
        provider: LLMProvider.ANTHROPIC,
        model: LLM_MODELS.anthropic.CLAUDE_3_HAIKU,
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        finishReason: 'stop',
        latencyMs: 200,
      });

      const result = await service.detectIntent(
        'Show me sales data',
        'luna',
        ['analyze_sales', 'general_question'],
      );

      expect(result.intent).toBe('analyze_sales');
      expect(result.confidence).toBeGreaterThan(0);
      expect(metrics.recordCacheMiss).toHaveBeenCalled();
      expect(cache.setSimple).toHaveBeenCalled();
    });

    it('should fallback to keyword detection on LLM error', async () => {
      cache.getSimple.mockResolvedValue(null);
      llmRouter.chat.mockRejectedValue(new Error('LLM unavailable'));

      const result = await service.detectIntent(
        'Show me sales data',
        'luna',
        ['analyze_sales', 'general_question'],
      );

      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeLessThan(1);
    });
  });
});
