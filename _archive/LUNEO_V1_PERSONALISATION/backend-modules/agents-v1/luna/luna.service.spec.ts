/**
 * LunaService - Tests unitaires
 * Tests pour l'agent Luna (B2B)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { LunaService, LunaIntentType } from './luna.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService } from '../services/llm-router.service';
import { ConversationService } from '../services/conversation.service';
import { AgentMemoryService } from '../services/agent-memory.service';
import { RAGService } from '../services/rag.service';
import { AgentUsageGuardService } from '../services/agent-usage-guard.service';
import { ReportsService } from '@/modules/analytics/services/reports.service';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { AnalyticsAdvancedService } from '@/modules/analytics/services/analytics-advanced.service';
import { MetricsService } from '@/modules/analytics/services/metrics.service';
import { PredictiveService } from '@/modules/analytics/services/predictive.service';
import { ProductsService } from '@/modules/products/products.service';
import { IntentDetectionService } from '../services/intent-detection.service';
import { ContextManagerService } from '../services/context-manager.service';

// ============================================================================
// MOCKS
// ============================================================================

const mockPrismaService = {
  brand: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  design: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockCacheService = {
  get: jest.fn((key: string, strategy: unknown, fn: () => Promise<unknown>) => fn ? fn() : null),
  set: jest.fn(),
  getSimple: jest.fn(),
  setSimple: jest.fn(),
  getOrSet: jest.fn((key: string, fn: () => Promise<unknown>) => fn()),
  invalidateTags: jest.fn(),
};

const mockLLMRouterService = {
  chat: jest.fn(),
  route: jest.fn(),
  getAvailableModels: jest.fn().mockReturnValue(['gpt-4', 'claude-3-sonnet']),
};

const mockConversationService = {
  getOrCreate: jest.fn(),
  addMessage: jest.fn(),
  getHistory: jest.fn(),
};

const mockMemoryService = {
  getContext: jest.fn(),
  storeContext: jest.fn(),
  updateContext: jest.fn(),
};

const mockAnalyticsService = {
  getDashboard: jest.fn(),
  getTopProductsByDesigns: jest.fn(),
  getTopPages: jest.fn(),
  getTopCountries: jest.fn(),
  getConversionFunnel: jest.fn(),
};

const mockAnalyticsAdvancedService = {
  getFunnels: jest.fn(),
  getFunnelData: jest.fn(),
  getCohortAnalysis: jest.fn(),
};

const mockMetricsService = {
  getRealTimeMetrics: jest.fn(),
  getMetrics: jest.fn(),
};

const mockPredictiveService = {
  getTrendPredictions: jest.fn(),
  getUpcomingSeasonalEvents: jest.fn(),
  detectAnomalies: jest.fn(),
  getRecommendations: jest.fn(),
  forecast: jest.fn(),
};

const mockProductsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

const mockReportsService = {
  generatePDFReport: jest.fn(),
  generateReport: jest.fn(),
};

const mockRAGService = {
  search: jest.fn(),
  enhancePrompt: jest.fn(),
};

const mockUsageGuardService = {
  checkUsageBeforeCall: jest.fn(),
  updateUsageAfterCall: jest.fn(),
  getCostCalculator: jest.fn().mockReturnValue({
    calculateCost: jest.fn().mockReturnValue({ costCents: 10 }),
    estimateCost: jest.fn().mockReturnValue(10),
  }),
};

const mockIntentDetectionService = {
  detectIntent: jest.fn(),
};

const mockContextManagerService = {
  compressHistory: jest.fn(),
  buildOptimizedContext: jest.fn(),
};

const mockModuleRef = {
  get: jest.fn((token: unknown) => {
    if (token === IntentDetectionService) return mockIntentDetectionService;
    if (token === ContextManagerService) return mockContextManagerService;
    return null;
  }),
};

// ============================================================================
// TESTS
// ============================================================================

describe('LunaService', () => {
  let service: LunaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LunaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SmartCacheService, useValue: mockCacheService },
        { provide: LLMRouterService, useValue: mockLLMRouterService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: AgentMemoryService, useValue: mockMemoryService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: ReportsService, useValue: mockReportsService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: AnalyticsAdvancedService, useValue: mockAnalyticsAdvancedService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: ModuleRef, useValue: mockModuleRef },
        { provide: RAGService, useValue: mockRAGService },
        { provide: PredictiveService, useValue: mockPredictiveService },
        { provide: AgentUsageGuardService, useValue: mockUsageGuardService },
      ],
    }).compile();

    service = module.get<LunaService>(LunaService);

    jest.clearAllMocks();
  });

  // Reconfigure mocks in nested beforeEach (after clearAllMocks)
  const setupDefaultMocks = () => {
    // ModuleRef
    mockModuleRef.get.mockImplementation((token: unknown) => {
      if (token === IntentDetectionService) return mockIntentDetectionService;
      if (token === ContextManagerService) return mockContextManagerService;
      return null;
    });

    // Cache
    mockCacheService.get.mockImplementation((key: string, strategy: unknown, fn: () => Promise<unknown>) => fn ? fn() : null);
    mockCacheService.getOrSet.mockImplementation((key: string, fn: () => Promise<unknown>) => fn());

    // Usage Guard
    mockUsageGuardService.checkUsageBeforeCall.mockResolvedValue({
      allowed: true,
      quota: { remaining: 1000, limit: 10000 },
      rateLimit: { allowed: true, remaining: 100 },
    });
    mockUsageGuardService.updateUsageAfterCall.mockResolvedValue(undefined);
    mockUsageGuardService.getCostCalculator.mockReturnValue({
      calculateCost: jest.fn().mockReturnValue({ costCents: 10 }),
      estimateCost: jest.fn().mockReturnValue(10),
    });

    // Prisma - Brand (with includes for context)
    mockPrismaService.brand.findUnique.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Brand',
      plan: 'pro',
      _count: {
        products: 10,
        designs: 50,
      },
      products: [
        { id: 'prod-1', name: 'Product 1', description: 'Description 1' },
        { id: 'prod-2', name: 'Product 2', description: 'Description 2' },
      ],
    });

    // Conversation
    mockConversationService.getOrCreate.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440001',
      brandId: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440002',
      agentType: 'luna',
      messages: [],
    });
    mockConversationService.getHistory.mockResolvedValue([]);
    mockConversationService.addMessage.mockResolvedValue(undefined);

    // Intent Detection
    mockIntentDetectionService.detectIntent.mockResolvedValue({
      intent: LunaIntentType.ANALYZE_SALES,
      confidence: 0.9,
      reasoning: 'User wants to analyze sales',
    });

    // RAG
    mockRAGService.enhancePrompt.mockResolvedValue({
      enhancedPrompt: 'Enhanced prompt with context',
      documents: [],
    });

    // LLM Router
    mockLLMRouterService.chat.mockResolvedValue({
      content: JSON.stringify({
        message: 'Voici votre analyse des ventes. Le chiffre d\'affaires est en hausse de 15%.',
        actions: [],
        suggestions: ['Voir les détails', 'Comparer avec le mois dernier'],
      }),
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      finishReason: 'stop',
      latencyMs: 500,
    });

    // Analytics
    mockAnalyticsService.getDashboard.mockResolvedValue({
      period: 'last_30_days',
      metrics: {
        totalDesigns: 150,
        totalRenders: 300,
        activeUsers: 50,
        revenue: 5000,
        conversionRate: 3.5,
        avgSessionDuration: '2m 30s',
      },
      charts: {
        designsOverTime: [{ date: '2024-01-01', count: 10 }],
        revenueOverTime: [{ date: '2024-01-01', amount: 500 }],
        viewsOverTime: [{ date: '2024-01-01', count: 100 }],
        conversionChange: 0.5,
      },
    });
    mockAnalyticsService.getTopProductsByDesigns.mockResolvedValue([
      { productId: 'prod-1', name: 'Product 1', designs: 50 },
    ]);

    // Metrics
    mockMetricsService.getRealTimeMetrics.mockResolvedValue({
      designsToday: 5,
      ordersToday: 2,
      conversionRate: 40,
    });

    // Predictive
    mockPredictiveService.getTrendPredictions.mockResolvedValue([]);
    mockPredictiveService.getUpcomingSeasonalEvents.mockResolvedValue([]);
    mockPredictiveService.detectAnomalies.mockResolvedValue([]);
    mockPredictiveService.getRecommendations.mockResolvedValue([]);

    // Analytics Advanced
    mockAnalyticsAdvancedService.getFunnels.mockResolvedValue([]);
    mockAnalyticsAdvancedService.getFunnelData.mockResolvedValue({
      funnelId: 'funnel-1',
      steps: [],
      totalConversion: 0,
    });
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    beforeEach(() => {
      setupDefaultMocks();
    });

    it('should process a chat message and return response', async () => {
      const result = await service.chat({
        brandId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        message: 'Analyse mes ventes',
      });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.conversationId).toBeDefined();
      expect(mockConversationService.getOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          agentType: 'luna',
        }),
      );
      expect(mockLLMRouterService.chat).toHaveBeenCalled();
    });

    it('should throw error when usage limit exceeded', async () => {
      mockUsageGuardService.checkUsageBeforeCall.mockResolvedValue({
        allowed: false,
        reason: 'Monthly quota exceeded',
        quota: { remaining: 0, limit: 10000 },
        rateLimit: { allowed: false, remaining: 0 },
      });

      await expect(
        service.chat({
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          message: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when conversation creation fails', async () => {
      mockConversationService.getOrCreate.mockRejectedValue(new Error('Database error'));

      await expect(
        service.chat({
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          message: 'Test',
        }),
      ).rejects.toThrow();
    });

    it('should validate input with Zod schema (empty brandId rejected)', async () => {
      await expect(
        service.chat({
          brandId: '',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          message: 'Test',
        }),
      ).rejects.toThrow();
    });
  });

  describe('chat with sales analysis intent', () => {
    beforeEach(() => {
      setupDefaultMocks();
      mockIntentDetectionService.detectIntent.mockResolvedValue({
        intent: LunaIntentType.ANALYZE_SALES,
        confidence: 0.95,
        reasoning: 'User wants to analyze sales data',
      });
    });

    it('should handle sales analysis requests', async () => {
      const result = await service.chat({
        brandId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        message: 'Analyse mes ventes du mois dernier',
      });

      expect(result).toBeDefined();
      expect(result.intent).toBe(LunaIntentType.ANALYZE_SALES);
      expect(mockAnalyticsService.getDashboard).toHaveBeenCalled();
    });
  });

  describe('chat with product recommendation intent', () => {
    beforeEach(() => {
      setupDefaultMocks();
      mockIntentDetectionService.detectIntent.mockResolvedValue({
        intent: LunaIntentType.RECOMMEND_PRODUCTS,
        confidence: 0.9,
        reasoning: 'User wants product recommendations',
      });

      mockLLMRouterService.chat.mockResolvedValue({
        content: JSON.stringify({
          message: 'Je vous recommande ces produits basés sur vos ventes.',
          actions: [{ type: 'show_products', data: { productIds: ['prod-1', 'prod-2'] } }],
          suggestions: ['Voir plus de détails'],
        }),
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
        finishReason: 'stop',
        latencyMs: 500,
      });
    });

    it('should handle product recommendation requests', async () => {
      const result = await service.chat({
        brandId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        message: 'Quels produits me recommandes-tu ?',
      });

      expect(result).toBeDefined();
      expect(result.intent).toBe(LunaIntentType.RECOMMEND_PRODUCTS);
    });
  });

  describe('chat with trends prediction intent', () => {
    beforeEach(() => {
      setupDefaultMocks();
      mockIntentDetectionService.detectIntent.mockResolvedValue({
        intent: LunaIntentType.PREDICT_TRENDS,
        confidence: 0.85,
        reasoning: 'User wants trend predictions',
      });

      mockPredictiveService.getTrendPredictions.mockResolvedValue([
        {
          metric: 'revenue',
          currentValue: 5000,
          predictedValue: 5500,
          changePercent: 10,
          confidence: 0.85,
          trend: 'up',
          horizon: '30d',
        },
      ]);

      mockPredictiveService.getUpcomingSeasonalEvents.mockResolvedValue([
        {
          name: 'Black Friday',
          date: new Date('2024-11-29'),
          daysUntil: 30,
          expectedImpact: 50,
          recommendations: ['Préparer campagne'],
        },
      ]);
    });

    it('should handle trend prediction requests', async () => {
      const result = await service.chat({
        brandId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        message: 'Quelles sont les tendances à venir ?',
      });

      expect(result).toBeDefined();
      expect(result.intent).toBe(LunaIntentType.PREDICT_TRENDS);
      expect(mockPredictiveService.getTrendPredictions).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      setupDefaultMocks();
    });

    it('should handle LLM service errors gracefully', async () => {
      mockLLMRouterService.chat.mockRejectedValue(new Error('LLM service unavailable'));

      await expect(
        service.chat({
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          message: 'Test',
        }),
      ).rejects.toThrow();

      expect(mockUsageGuardService.updateUsageAfterCall).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000', // brandId
        '550e8400-e29b-41d4-a716-446655440002', // userId
        undefined, // agentId
        expect.objectContaining({ success: false }),
        'anthropic',
        'claude-3-sonnet',
        'chat',
      );
    });

    it('should track usage even when request fails', async () => {
      mockLLMRouterService.chat.mockRejectedValue(new Error('API error'));

      await expect(
        service.chat({
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          message: 'Test',
        }),
      ).rejects.toThrow();

      expect(mockUsageGuardService.updateUsageAfterCall).toHaveBeenCalled();
    });
  });
});
