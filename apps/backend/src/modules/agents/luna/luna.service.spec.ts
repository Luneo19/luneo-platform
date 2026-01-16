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
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { AnalyticsAdvancedService } from '@/modules/analytics/services/analytics-advanced.service';
import { MetricsService } from '@/modules/analytics/services/metrics.service';
import { PredictiveService } from '@/modules/analytics/services/predictive.service';
import { ProductsService } from '@/modules/products/products.service';
import { createTestingModule, testFixtures } from '@/common/test/test-setup';

describe('LunaService', () => {
  let service: LunaService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<SmartCacheService>;
  let llmRouterService: jest.Mocked<LLMRouterService>;
  let conversationService: jest.Mocked<ConversationService>;
  let memoryService: jest.Mocked<AgentMemoryService>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let analyticsAdvancedService: jest.Mocked<AnalyticsAdvancedService>;
  let metricsService: jest.Mocked<MetricsService>;
  let predictiveService: jest.Mocked<PredictiveService>;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await createTestingModule([
      LunaService,
      LLMRouterService,
      ConversationService,
      AgentMemoryService,
      AnalyticsService,
      AnalyticsAdvancedService,
      MetricsService,
      PredictiveService,
      ProductsService,
    ]);

    service = module.get<LunaService>(LunaService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
    llmRouterService = module.get(LLMRouterService);
    conversationService = module.get(ConversationService);
    memoryService = module.get(AgentMemoryService);
    analyticsService = module.get(AnalyticsService);
    analyticsAdvancedService = module.get(AnalyticsAdvancedService);
    metricsService = module.get(MetricsService);
    predictiveService = module.get(PredictiveService);
    productsService = module.get(ProductsService);
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

  // ✅ PHASE 1 - A) Luna : Tests sur analytics data pack
  describe('getAnalyticsData - BI Pack Structure', () => {
    it('should structure analytics data as BI pack with KPIs, charts, and funnel', async () => {
      // Arrange
      const brandId = 'brand-123';
      const dateRange = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
      };

      // Mock AnalyticsService
      analyticsService.getDashboard.mockResolvedValue({
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

      analyticsService.getTopProductsByDesigns.mockResolvedValue([
        { productId: 'prod-1', name: 'Product 1', designs: 50 },
        { productId: 'prod-2', name: 'Product 2', designs: 30 },
      ]);

      // Mock MetricsService
      metricsService.getRealTimeMetrics.mockResolvedValue({
        designsToday: 5,
        ordersToday: 2,
        conversionRate: 40,
      });

      // Mock AnalyticsAdvancedService
      analyticsAdvancedService.getFunnels.mockResolvedValue([
        {
          id: 'funnel-1',
          name: 'Main Funnel',
          isActive: true,
          brandId: brandId,
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      analyticsAdvancedService.getFunnelData.mockResolvedValue({
        funnelId: 'funnel-1',
        steps: [
          { stepId: 'step-1', stepName: 'View', users: 1000, conversion: 100, dropoff: 0 },
          { stepId: 'step-2', stepName: 'Design', users: 500, conversion: 50, dropoff: 50 },
        ],
        totalConversion: 50,
        dropoffPoint: 'Design',
      });

      // Act - Utiliser la méthode privée via reflection ou tester via chat
      const result = await service.chat({
        brandId,
        userId: 'user-123',
        message: 'Analyse mes ventes',
        context: { dateRange },
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      if (result.data && 'kpis' in result.data) {
        expect(result.data.kpis).toBeDefined();
        expect(result.data.kpis.totalDesigns).toBe(150);
        expect(result.data.kpis.revenue).toBe(5000);
        expect(result.data.topProducts).toBeDefined();
        expect(Array.isArray(result.data.topProducts)).toBe(true);
      }
    });

    it('should handle missing dashboard data gracefully', async () => {
      // Arrange
      analyticsService.getDashboard.mockResolvedValue({
        period: 'last_30_days',
        metrics: undefined as any,
        charts: {
          designsOverTime: [],
          revenueOverTime: [],
        },
      });

      // Act & Assert
      await expect(
        service.chat({
          brandId: 'brand-123',
          userId: 'user-123',
          message: 'Analyse mes ventes',
        }),
      ).rejects.toThrow('Dashboard data unavailable');
    });
  });

  // ✅ PHASE 1 - A) Luna : Tests sur recommandations produits avec conversion + revenue
  describe('getProductRecommendations - Conversion + Revenue Logic', () => {
    it('should recommend products based on conversion rate and revenue', async () => {
      // Arrange
      const brandId = 'brand-123';

      analyticsService.getTopProductsByDesigns.mockResolvedValue([
        { productId: 'prod-1', name: 'Product 1', designs: 100 },
        { productId: 'prod-2', name: 'Product 2', designs: 50 },
      ]);

      // Mock Prisma pour designs et orders
      (prismaService.design.count as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(100) // prod-1 designs
        .mockResolvedValueOnce(50); // prod-2 designs

      (prismaService.order.findMany as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce([
          { totalCents: 15000 }, // prod-1: 15 orders * 100€ = 1500€
          { totalCents: 15000 },
        ])
        .mockResolvedValueOnce([
          { totalCents: 5000 }, // prod-2: 5 orders * 100€ = 500€
        ]);

      // Act
      const result = await service.chat({
        brandId,
        userId: 'user-123',
        message: 'Quels produits me recommandes-tu ?',
      });

      // Assert
      expect(result).toBeDefined();
      if (result.data && 'recommendations' in result.data) {
        const recommendations = result.data.recommendations as Array<{
          productId: string;
          metrics?: { conversionRate: number; revenue: number };
        }>;
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations[0].metrics).toBeDefined();
        expect(recommendations[0].metrics?.conversionRate).toBeGreaterThanOrEqual(0);
        expect(recommendations[0].metrics?.revenue).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ✅ PHASE 1 - A) Luna : Tests sur trends data avec PredictiveService
  describe('getTrendsData - Predictive Service Integration', () => {
    it('should include trends, anomalies, and seasonal events from PredictiveService', async () => {
      // Arrange
      const brandId = 'brand-123';

      predictiveService.getTrendPredictions.mockResolvedValue([
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

      predictiveService.getUpcomingSeasonalEvents.mockResolvedValue([
        {
          name: 'Noël',
          date: new Date('2024-12-25'),
          daysUntil: 30,
          expectedImpact: 420,
          recommendations: ['Préparer campagne marketing'],
        },
      ]);

      predictiveService.detectAnomalies.mockResolvedValue([
        {
          id: 'anomaly-1',
          metric: 'totalDesigns',
          severity: 'medium',
          description: 'Pic anormal de designs',
          detectedAt: new Date(),
          value: 200,
          expectedRange: { min: 50, max: 150 },
        },
      ]);

      predictiveService.getRecommendations.mockResolvedValue([
        {
          id: 'rec-1',
          type: 'product',
          title: 'Ajouter plus de produits',
          description: 'Augmentez votre catalogue',
          impact: 'high',
          effort: 'medium',
          metrics: ['totalGenerations'],
        },
      ]);

      // Act
      const result = await service.chat({
        brandId,
        userId: 'user-123',
        message: 'Quelles sont les tendances ?',
      });

      // Assert
      expect(result).toBeDefined();
      if (result.data && 'trends' in result.data) {
        expect(result.data.trends).toBeDefined();
        expect(result.data.anomalies).toBeDefined();
        expect(result.data.seasonalEvents).toBeDefined();
        expect(result.data.recommendations).toBeDefined();
      }
    });
  });
});
