/**
 * @fileoverview Agent Luna - Assistant Business Intelligence pour clients B2B
 * @module LunaService
 *
 * CAPACITÉS:
 * - Analyse des ventes et personnalisations
 * - Recommandations produits
 * - Optimisation des prompts IA
 * - Prédiction des tendances
 * - Génération de rapports
 * - Configuration assistée
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation Zod
 * - ✅ Gestion d'erreurs
 * - ✅ Logging structuré
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { z } from 'zod';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from '../services/llm-router.service';
import { ConversationService } from '../services/conversation.service';
import { AgentMemoryService } from '../services/agent-memory.service';
import { ProductsService } from '@/modules/products/products.service';
import { ReportsService } from '@/modules/analytics/services/reports.service';
import { PredictiveService } from '@/modules/analytics/services/predictive.service';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { AnalyticsAdvancedService } from '@/modules/analytics/services/analytics-advanced.service';
import { MetricsService } from '@/modules/analytics/services/metrics.service';
import type {
  AnalyticsChart,
  AnalyticsMetrics,
} from '@/modules/analytics/interfaces/analytics.interface';
import type { FunnelData } from '@/modules/analytics/interfaces/analytics-advanced.interface';
import { IntentDetectionService } from '../services/intent-detection.service';
import { ContextManagerService } from '../services/context-manager.service';
import { RAGService } from '../services/rag.service';
import { AgentUsageGuardService } from '../services/agent-usage-guard.service';
import { CurrentUser } from '@/common/types/user.types';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Types de requêtes que Luna peut traiter
 */
export enum LunaIntentType {
  ANALYZE_SALES = 'analyze_sales',
  RECOMMEND_PRODUCTS = 'recommend_products',
  OPTIMIZE_PROMPT = 'optimize_prompt',
  PREDICT_TRENDS = 'predict_trends',
  GENERATE_REPORT = 'generate_report',
  CONFIGURE_PRODUCT = 'configure_product',
  GENERAL_QUESTION = 'general_question',
}

/**
 * Schema pour les messages utilisateur
 */
const UserMessageSchema = z.object({
  brandId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    currentPage: z.string().optional(),
    selectedProductId: z.string().optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
});

export type LunaUserMessage = z.infer<typeof UserMessageSchema>;

/**
 * Réponse de Luna
 */
export interface LunaResponse {
  conversationId: string;
  message: string;
  intent: LunaIntentType;
  confidence: number;
  actions: LunaAction[];
  data?: LunaIntentData; // ✅ Typage strict au lieu de Record<string, unknown>
  suggestions: string[];
}

// ============================================================================
// TYPES STRICTS POUR LES DONNÉES D'INTENTION
// ============================================================================

/**
 * Métriques en temps réel
 */
interface RealTimeMetrics {
  designsToday: number;
  ordersToday: number;
  conversionRate: number;
}

/**
 * Top produit avec statistiques
 */
interface TopProduct {
  productId: string;
  name: string;
  designs: number;
}

/**
 * Données de funnel enrichies
 */
interface EnrichedFunnelData {
  id: string;
  totalConversion: number;
  dropoffPoint?: string;
  steps: FunnelData['steps'];
}

/**
 * Données analytics complètes pour Luna
 */
interface AnalyticsData {
  period: {
    start: string;
    end: string;
    key: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  };
  kpis: {
    totalDesigns: number;
    totalRenders: number;
    activeUsers: number;
    revenue: number;
    conversionRate: number;
    avgSessionDuration: string;
    arSessions: number;
    arTryOn: number;
    arConversions: number;
    arConversionRate: number;
    conversionChange: number;
  };
  realTime: RealTimeMetrics;
  charts: {
    designsOverTime: AnalyticsChart[];
    revenueOverTime: AnalyticsChart[];
    viewsOverTime?: AnalyticsChart[];
  };
  topProducts: TopProduct[];
  funnel: EnrichedFunnelData | null;
}

/**
 * Données de recommandations produits avec métriques enrichies
 */
interface ProductRecommendationsData {
  recommendations: Array<{
    productId: string;
    category: string;
    suggestion: string;
    reason: string;
    metrics?: {
      designs: number;
      orders: number;
      conversionRate: number;
      revenue: number;
    };
  }>;
  note?: string;
}

/**
 * Données de tendances prédictives
 */
interface TrendsData {
  trends: unknown;
  seasonalEvents: unknown;
  anomalies: unknown;
  recommendations: unknown;
}

/**
 * Données de configuration de produits
 */
interface ConfigurationTemplatesData {
  templates: Array<{
    id: string;
    name: string;
    fields: string[];
    zones: Array<{
      id: string;
      name: string;
      type: string;
      maxLength: number | null;
      allowedFonts: string[] | null;
      allowedColors: string[] | null;
    }>;
  }>;
}

/**
 * Union type strict pour toutes les données d'intention
 */
type LunaIntentData =
  | AnalyticsData
  | ProductRecommendationsData
  | TrendsData
  | ConfigurationTemplatesData
  | Record<string, never>; // Pour les cas par défaut (empty object)

/**
 * Actions que Luna peut proposer
 */
export interface LunaAction {
  type: 'create_product' | 'update_product' | 'generate_report' | 'navigate' | 'configure';
  label: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
}

// ============================================================================
// PROMPTS SYSTÈME
// ============================================================================

const LUNA_SYSTEM_PROMPT = `Tu es Luna, l'assistante Business Intelligence de Luneo Platform.

PERSONNALITÉ:
- Professionnelle mais chaleureuse
- Experte en e-commerce et personnalisation produit
- Proactive dans tes recommandations
- Concise et orientée action

CAPACITÉS:
1. Analyse des ventes et personnalisations (tendances, top produits, conversions)
2. Recommandations de produits à personnaliser
3. Optimisation des prompts IA pour la génération d'images
4. Prédiction des tendances saisonnières
5. Génération de rapports automatiques
6. Configuration assistée de nouveaux produits

RÈGLES:
- Toujours baser tes analyses sur les données réelles du brand
- Proposer des actions concrètes avec boutons
- Utiliser des emojis avec parcimonie (📊 💡 ✨ ✅)
- Formater les données importantes en gras
- Limiter les réponses à 3-4 paragraphes maximum

CONTEXTE BRAND:
{brandContext}

DONNÉES RÉCENTES:
{recentData}

HISTORIQUE CONVERSATION:
{conversationHistory}`;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LunaService {
  private readonly logger = new Logger(LunaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly llmRouter: LLMRouterService,
    private readonly conversationService: ConversationService,
    private readonly memoryService: AgentMemoryService,
    private readonly productsService: ProductsService,
    private readonly reportsService: ReportsService,
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsAdvancedService: AnalyticsAdvancedService,
    private readonly metricsService: MetricsService,
    private readonly moduleRef: ModuleRef,
    private readonly ragService: RAGService,
    private readonly predictiveService: PredictiveService,
    private readonly usageGuard: AgentUsageGuardService,
  ) {}

  /**
   * Traite un message utilisateur et génère une réponse
   */
  async chat(input: LunaUserMessage): Promise<LunaResponse> {
    // ✅ RÈGLE: Validation Zod
    const validated = UserMessageSchema.parse(input);
    const startTime = Date.now();

    try {
      // 0. Vérifier usage (Usage Guardian) - AVANT tout traitement
      const brand = await this.prisma.brand.findUnique({
        where: { id: validated.brandId },
        select: { plan: true },
      });

      const usageCheck = await this.usageGuard.checkUsageBeforeCall(
        validated.brandId,
        validated.userId,
        brand?.plan,
        4096, // Estimation par défaut
        'anthropic',
        'claude-3-sonnet',
      );

      if (!usageCheck.allowed) {
        throw new BadRequestException(usageCheck.reason || 'Usage limit exceeded');
      }

      // 1. Récupérer ou créer la conversation
      const conversation = await this.conversationService.getOrCreate({
        id: validated.conversationId,
        brandId: validated.brandId,
        userId: validated.userId,
        agentType: 'luna',
      });

      // 2. Détecter l'intention (avec LLM classification)
      const intent = await this.detectIntent(validated.message, validated.brandId);

      // 3. Récupérer le contexte du brand
      const brandContext = await this.getBrandContext(validated.brandId);

      // ✅ PHASE 3: Enrichir avec RAG si nécessaire
      let enhancedMessage = validated.message;
      let ragContext = '';
      
      if (intent === LunaIntentType.GENERAL_QUESTION || validated.message.length > 50) {
        try {
          const ragResult = await this.ragService.enhancePrompt(
            validated.message,
            validated.message,
            validated.brandId,
            { limit: 3 },
          );
          ragContext = ragResult.documents
            .map((doc) => doc.content)
            .join('\n\n');
          enhancedMessage = ragResult.enhancedPrompt;
          this.logger.debug(`RAG enhanced prompt with ${ragResult.documents.length} documents`);
        } catch (error) {
          this.logger.warn(`RAG enhancement failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }

      // 4. Récupérer les données récentes selon l'intention et structurer en pack BI
      const recentData = await this.getRelevantData(validated.brandId, intent, validated.context);
      const biPack = this.structureBIPack(recentData, intent, validated.brandId);

      // 5. Récupérer l'historique de conversation (avec compression si nécessaire)
      const allHistory = await this.conversationService.getHistory(conversation.id, 50); // Récupérer plus pour compression
      
      // ✅ PHASE 2: Compresser l'historique si trop long
      const contextManager = this.moduleRef.get(ContextManagerService, { strict: false });
      let optimizedHistory: Message[];
      
      if (contextManager && allHistory.length > 20) {
        const compressed = await contextManager.compressHistory(allHistory, validated.brandId);
        optimizedHistory = contextManager.buildOptimizedContext(compressed, validated.message);
        this.logger.debug(`Compressed history: saved ${compressed.totalTokensSaved} tokens`);
      } else {
        // Utiliser historique récent directement
        const recentHistory = allHistory.slice(-10);
        optimizedHistory = [
          { role: 'system', content: LUNA_SYSTEM_PROMPT
            .replace('{brandContext}', JSON.stringify(brandContext, null, 2))
            .replace('{recentData}', JSON.stringify(biPack, null, 2))
            .replace('{conversationHistory}', this.formatHistory(recentHistory))
          },
          { role: 'user', content: validated.message },
        ];
      }

      // 6. Construire le prompt (déjà fait dans optimizedHistory si compression)
      let systemPrompt = optimizedHistory.find(m => m.role === 'system')?.content || LUNA_SYSTEM_PROMPT
        .replace('{brandContext}', JSON.stringify(brandContext, null, 2))
        .replace('{recentData}', JSON.stringify(recentData, null, 2))
        .replace('{conversationHistory}', this.formatHistory(allHistory.slice(-10)));

      // Ajouter contexte RAG si disponible
      if (ragContext) {
        systemPrompt += `\n\nContexte de la base de connaissances:\n${ragContext}`;
      }

      // 7. Appeler le LLM (utiliser optimizedHistory si disponible)
      const messages: Message[] = optimizedHistory.length > 0 
        ? optimizedHistory.map(m => m.role === 'system' ? { ...m, content: systemPrompt } : m)
        : [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: enhancedMessage },
          ];

      // Remplacer le dernier message user par enhancedMessage si RAG activé
      if (ragContext && messages[messages.length - 1].role === 'user') {
        messages[messages.length - 1].content = enhancedMessage;
      }

      const llmResponse = await this.llmRouter.chat({
        provider: LLMProvider.ANTHROPIC,
        model: LLM_MODELS.anthropic.CLAUDE_3_SONNET,
        messages,
        temperature: 0.7,
        maxTokens: 2048,
        stream: false,
        brandId: validated.brandId,
        agentType: 'luna',
        enableFallback: true,
      });

      const latencyMs = Date.now() - startTime;

      // Calculer le coût
      const costCalculation = this.usageGuard.getCostCalculator().calculateCost(
        'anthropic',
        'claude-3-sonnet',
        {
          inputTokens: llmResponse.usage?.promptTokens || 0,
          outputTokens: llmResponse.usage?.completionTokens || 0,
          totalTokens: llmResponse.usage?.totalTokens || 0,
        },
      );

      // 8. Parser la réponse et extraire les actions
      const { message, actions, suggestions } = this.parseResponse(
        llmResponse.content,
        intent,
        biPack.detailed,
      );

      // 9. Sauvegarder dans l'historique
      await this.conversationService.addMessage(conversation.id, {
        role: 'user',
        content: validated.message,
      });

      await this.conversationService.addMessage(conversation.id, {
        role: 'assistant',
        content: message,
        metadata: { intent, actions },
      });

      // 10. Mettre à jour la mémoire de l'agent
      await this.memoryService.updateContext(conversation.id, {
        lastIntent: intent,
        lastDataAccessed: Object.keys(biPack.detailed),
      });

      // 11. Mettre à jour l'usage (Usage Guardian + AI Monitor)
      await this.usageGuard.updateUsageAfterCall(
        validated.brandId,
        validated.userId,
        undefined, // agentId sera 'luna'
        {
          tokens: {
            input: llmResponse.usage?.promptTokens || 0,
            output: llmResponse.usage?.completionTokens || 0,
          },
          costCents: costCalculation.costCents,
          latencyMs,
          success: true,
        },
        'anthropic',
        'claude-3-sonnet',
        'chat',
      );

      const confidence = this.computeConfidence(
        message,
        llmResponse.usage?.completionTokens ?? 0,
        Boolean(ragContext),
      );

      return {
        conversationId: conversation.id,
        message,
        intent,
        confidence,
        actions,
        data: biPack.detailed, // ✅ Retourner les données détaillées (compatibilité)
        suggestions,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Tracker l'erreur (AI Monitor)
      await this.usageGuard.updateUsageAfterCall(
        validated.brandId,
        validated.userId,
        undefined,
        {
          tokens: { input: 0, output: 0 },
          costCents: 0,
          latencyMs,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        'anthropic',
        'claude-3-sonnet',
        'chat',
      );

      this.logger.error(`Luna chat error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Détecte l'intention du message utilisateur (améliorée avec LLM)
   */
  private async detectIntent(message: string, brandId?: string): Promise<LunaIntentType> {
    // ✅ PHASE 2: Utiliser IntentDetectionService pour classification précise
    const intentService = this.moduleRef.get(IntentDetectionService, { strict: false });
    
    if (intentService) {
      const possibleIntents: LunaIntentType[] = [
        LunaIntentType.ANALYZE_SALES,
        LunaIntentType.RECOMMEND_PRODUCTS,
        LunaIntentType.OPTIMIZE_PROMPT,
        LunaIntentType.PREDICT_TRENDS,
        LunaIntentType.GENERATE_REPORT,
        LunaIntentType.CONFIGURE_PRODUCT,
        LunaIntentType.GENERAL_QUESTION,
      ];

      try {
        const result = await intentService.detectIntent(
          message,
          'luna',
          possibleIntents,
          brandId,
        );

        this.logger.debug(
          `Intent detected: ${result.intent} (confidence: ${result.confidence})`,
        );

        return result.intent as LunaIntentType;
      } catch (error) {
        this.logger.warn(
          `Intent detection failed, using fallback: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }
    }

    // Fallback: keyword-based intent classification (map of intents to keyword patterns)
    const intentKeywords: Record<LunaIntentType, string[]> = {
      [LunaIntentType.ANALYZE_SALES]: ['vente', 'chiffre', 'ventes', 'ca', 'revenus', 'analyse'],
      [LunaIntentType.RECOMMEND_PRODUCTS]: ['recommand', 'suggère', 'suggestion', 'recommandation', 'top produit'],
      [LunaIntentType.OPTIMIZE_PROMPT]: ['prompt', 'améliore', 'optimise', 'formulation'],
      [LunaIntentType.PREDICT_TRENDS]: ['tendance', 'prévi', 'prédiction', 'évolution', 'forecast'],
      [LunaIntentType.GENERATE_REPORT]: ['rapport', 'export', 'exporter', 'pdf', 'bilan'],
      [LunaIntentType.CONFIGURE_PRODUCT]: ['configur', 'créer', 'nouveau', 'produit', 'template'],
      [LunaIntentType.GENERAL_QUESTION]: [],
    };

    const lowerMessage = message.toLowerCase();
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (intent === LunaIntentType.GENERAL_QUESTION) continue;
      if (keywords.some((kw) => lowerMessage.includes(kw))) {
        return intent as LunaIntentType;
      }
    }

    return LunaIntentType.GENERAL_QUESTION;
  }

  /**
   * Calcule la confiance dynamiquement (heuristique: tokens, mots-clés, appels externes)
   */
  private computeConfidence(
    responseMessage: string,
    responseTokenCount: number,
    usedExternalApi: boolean,
  ): number {
    let confidence = 0.9;
    if (responseTokenCount > 0 && responseTokenCount < 200) {
      confidence += 0.05;
    }
    if (/i'm not sure|je ne suis pas sûr|pas certain|unsure/i.test(responseMessage)) {
      confidence -= 0.1;
    }
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Récupère le contexte du brand
   */
  private async getBrandContext(brandId: string): Promise<Record<string, unknown>> {
    const cacheKey = `luna:brand-context:${brandId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const brand = await this.prisma.brand.findUnique({
          where: { id: brandId },
          include: {
            products: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                products: true,
                designs: true,
              },
            },
          },
        });

        return {
          name: brand?.name,
          productCount: brand?._count.products,
          designCount: brand?._count.designs,
          recentProducts: brand?.products.map(p => ({
            id: p.id,
            name: p.name,
          })),
        };
      },
      300 // Cache 5 minutes
    );
  }

  /**
   * Récupère les données pertinentes selon l'intention avec typage strict
   */
  private async getRelevantData(
    brandId: string,
    intent: LunaIntentType,
    context?: LunaUserMessage['context'],
  ): Promise<LunaIntentData> {
    try {
      switch (intent) {
        case LunaIntentType.ANALYZE_SALES:
          return await this.getAnalyticsData(brandId, context?.dateRange);

        case LunaIntentType.RECOMMEND_PRODUCTS:
          return await this.getProductRecommendations(brandId);

        case LunaIntentType.PREDICT_TRENDS:
          return await this.getTrendsData(brandId);

        case LunaIntentType.CONFIGURE_PRODUCT:
          return await this.getConfigurationTemplates(brandId);

        default:
          // ✅ Retourner un objet vide typé plutôt que {}
          return {} as Record<string, never>;
      }
    } catch (error) {
      this.logger.error(
        `Failed to get relevant data for intent ${intent}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      // ✅ Retourner un objet vide typé en cas d'erreur
      return {} as Record<string, never>;
    }
  }

  /**
   * Récupère les données analytics avec typage strict et validation robuste
   */
  private async getAnalyticsData(
    brandId: string,
    dateRange?: { start?: string; end?: string },
  ): Promise<AnalyticsData> {
    const { startDate, endDate, periodKey } = this.resolveDateRange(dateRange);

    // ✅ Appels parallèles pour performance optimale
    const [dashboard, realTimeMetrics, topProducts, funnels] = await Promise.all([
      this.analyticsService.getDashboard(periodKey, brandId),
      this.metricsService.getRealTimeMetrics(brandId),
      this.analyticsService.getTopProductsByDesigns(brandId, startDate, endDate, 5),
      this.analyticsAdvancedService.getFunnels(brandId),
    ]);

    // ✅ Garde pour éviter les crashes si dashboard est null/undefined
    if (!dashboard || !dashboard.metrics) {
      this.logger.warn(`Dashboard data incomplete for brand ${brandId}`);
      throw new InternalServerErrorException('Dashboard data unavailable');
    }

    // ✅ Logique explicite pour la sélection du funnel
    const selectedFunnel = this.selectFunnel(funnels);
    const funnelData = selectedFunnel
      ? await this.analyticsAdvancedService.getFunnelData(selectedFunnel.id, brandId, {
          brandId,
          startDate,
          endDate,
        })
      : null;

    // ✅ Construction des KPIs avec gardes et valeurs par défaut
    const kpis = this.buildKpis(dashboard, realTimeMetrics);
    
    // ✅ Construction du funnel enrichi
    const enrichedFunnel = this.buildEnrichedFunnel(funnelData);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        key: periodKey,
      },
      kpis,
      realTime: this.buildRealTimeMetrics(realTimeMetrics),
      charts: {
        designsOverTime: dashboard.charts?.designsOverTime ?? [],
        revenueOverTime: dashboard.charts?.revenueOverTime ?? [],
        viewsOverTime: dashboard.charts?.viewsOverTime,
      },
      topProducts: this.normalizeTopProducts(topProducts),
      funnel: enrichedFunnel,
    };
  }

  /**
   * Sélectionne le funnel le plus approprié selon une logique explicite
   * Priorité: 1) Funnel actif par défaut, 2) Premier funnel actif, 3) Premier funnel disponible
   */
  private selectFunnel(funnels: Array<{ id: string; isActive: boolean; isDefault?: boolean }>): { id: string; isActive: boolean } | null {
    if (!funnels || funnels.length === 0) {
      return null;
    }

    // 1. Chercher le funnel marqué comme défaut ET actif
    const defaultActive = funnels.find((f) => f.isDefault === true && f.isActive === true);
    if (defaultActive) {
      this.logger.debug(`Selected default active funnel: ${defaultActive.id}`);
      return defaultActive;
    }

    // 2. Chercher le premier funnel actif
    const firstActive = funnels.find((f) => f.isActive === true);
    if (firstActive) {
      this.logger.debug(`Selected first active funnel: ${firstActive.id}`);
      return firstActive;
    }

    // 3. Fallback: premier funnel disponible
    const firstAvailable = funnels[0];
    if (firstAvailable) {
      this.logger.debug(`Selected first available funnel: ${firstAvailable.id} (may be inactive)`);
      return firstAvailable;
    }

    return null;
  }

  /**
   * Construit les KPIs avec gardes et valeurs par défaut
   */
  private buildKpis(
    dashboard: { metrics?: AnalyticsMetrics; charts?: { conversionChange?: number } },
    realTimeMetrics: unknown,
  ): AnalyticsData['kpis'] {
    const metrics = dashboard?.metrics;
    
    // ✅ Garde pour éviter les crashes
    if (!metrics) {
      this.logger.warn('Metrics unavailable, using default values');
      return {
        totalDesigns: 0,
        totalRenders: 0,
        activeUsers: 0,
        revenue: 0,
        conversionRate: 0,
        avgSessionDuration: '0s',
        arSessions: 0,
        arTryOn: 0,
        arConversions: 0,
        arConversionRate: 0,
        conversionChange: 0,
      };
    }

    // ✅ Extension pour métriques AR (si présentes dans AnalyticsMetrics)
    const extendedMetrics = metrics as AnalyticsMetrics & {
      arSessions?: number;
      arTryOn?: number;
      arConversions?: number;
      arConversionRate?: number;
    };

    return {
      totalDesigns: metrics.totalDesigns ?? 0,
      totalRenders: metrics.totalRenders ?? 0,
      activeUsers: metrics.activeUsers ?? 0,
      revenue: metrics.revenue ?? 0,
      conversionRate: metrics.conversionRate ?? 0,
      avgSessionDuration: metrics.avgSessionDuration ?? '0s',
      arSessions: extendedMetrics.arSessions ?? 0,
      arTryOn: extendedMetrics.arTryOn ?? 0,
      arConversions: extendedMetrics.arConversions ?? 0,
      arConversionRate: extendedMetrics.arConversionRate ?? 0,
      conversionChange: dashboard.charts?.conversionChange ?? 0,
    };
  }

  /**
   * Construit les métriques en temps réel avec validation
   */
  private buildRealTimeMetrics(realTimeMetrics: unknown): RealTimeMetrics {
    if (!realTimeMetrics || typeof realTimeMetrics !== 'object') {
      this.logger.warn('Real-time metrics unavailable, using defaults');
      return {
        designsToday: 0,
        ordersToday: 0,
        conversionRate: 0,
      };
    }

    const metrics = realTimeMetrics as Partial<RealTimeMetrics>;
    return {
      designsToday: metrics.designsToday ?? 0,
      ordersToday: metrics.ordersToday ?? 0,
      conversionRate: metrics.conversionRate ?? 0,
    };
  }

  /**
   * Normalise les top produits avec validation
   */
  private normalizeTopProducts(
    products: Array<{ productId: string; name: string; designs: number }>,
  ): TopProduct[] {
    if (!Array.isArray(products)) {
      return [];
    }

    return products.map((product) => ({
      productId: product.productId ?? '',
      name: product.name ?? 'Produit inconnu',
      designs: typeof product.designs === 'number' ? product.designs : 0,
    }));
  }

  /**
   * Construit le funnel enrichi à partir des données brutes
   */
  private buildEnrichedFunnel(funnelData: FunnelData | null): EnrichedFunnelData | null {
    if (!funnelData) {
      return null;
    }

    return {
      id: funnelData.funnelId ?? '',
      totalConversion: funnelData.totalConversion ?? 0,
      dropoffPoint: funnelData.dropoffPoint,
      steps: funnelData.steps ?? [],
    };
  }

  /**
   * Résout et valide la plage de dates avec gardes robustes
   */
  private resolveDateRange(dateRange?: { start?: string; end?: string }): {
    startDate: Date;
    endDate: Date;
    periodKey: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  } {
    const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultEnd = new Date();

    // ✅ Validation stricte des dates avec gardes
    const startDate = this.parseAndValidateDate(dateRange?.start, defaultStart);
    const endDate = this.parseAndValidateDate(dateRange?.end, defaultEnd);

    // ✅ Vérifier que startDate < endDate
    if (startDate.getTime() >= endDate.getTime()) {
      this.logger.warn('Invalid date range: start >= end, using defaults');
      return {
        startDate: defaultStart,
        endDate: defaultEnd,
        periodKey: this.getPeriodKey(defaultStart, defaultEnd),
      };
    }

    return {
      startDate,
      endDate,
      periodKey: this.getPeriodKey(startDate, endDate),
    };
  }

  /**
   * Parse et valide une date ISO string avec gardes
   */
  private parseAndValidateDate(dateString: string | undefined, fallback: Date): Date {
    if (!dateString || typeof dateString !== 'string') {
      return fallback;
    }

    // ✅ Validation ISO 8601 avec Date.parse (plus robuste que new Date)
    const timestamp = Date.parse(dateString);
    if (Number.isNaN(timestamp)) {
      this.logger.warn(`Invalid date string: ${dateString}, using fallback`);
      return fallback;
    }

    const parsedDate = new Date(timestamp);
    
    // ✅ Vérifier que la date est valide (évite les dates invalides comme "Invalid Date")
    if (Number.isNaN(parsedDate.getTime())) {
      this.logger.warn(`Parsed date is invalid: ${dateString}, using fallback`);
      return fallback;
    }

    return parsedDate;
  }

  private getPeriodKey(
    startDate: Date,
    endDate: Date,
  ): 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' {
    const diffDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    if (diffDays <= 7) {
      return 'last_7_days';
    }
    if (diffDays <= 30) {
      return 'last_30_days';
    }
    if (diffDays <= 90) {
      return 'last_90_days';
    }
    return 'last_year';
  }

  /**
   * Récupère les recommandations produits avec logique basée sur topProducts + conversion + revenue
   * Conforme au plan PHASE 1 - A) Luna - Recommandations produits réelles
   */
  private async getProductRecommendations(brandId: string): Promise<ProductRecommendationsData> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getProductRecommendations');
      return {
        recommendations: [],
        note: 'Brand ID invalide.',
      };
    }

    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      // ✅ Récupérer topProducts + conversion + revenue en parallèle
      const [topProducts, dashboard] = await Promise.all([
        this.analyticsService.getTopProductsByDesigns(
          brandId.trim(),
          startDate,
          endDate,
          10, // Récupérer plus pour calculer conversion/revenue
        ),
        this.analyticsService.getDashboard('last_30_days', brandId.trim()),
      ]);

      if (!topProducts || topProducts.length === 0) {
        return {
          recommendations: [],
          note: 'Aucune personnalisation détectée sur les 30 derniers jours.',
        };
      }

      // ✅ Calculer conversion et revenue par produit
      const productStats = await Promise.all(
        topProducts.map(async (product) => {
          if (!product.productId) {
            return null;
          }

          // Récupérer designs et orders pour ce produit
          const [designsCount, ordersData] = await Promise.all([
            this.prisma.design.count({
              where: {
                brandId: brandId.trim(),
                productId: product.productId,
                createdAt: { gte: startDate, lte: endDate },
              },
            }),
            this.prisma.order.findMany({
              where: {
                brandId: brandId.trim(),
                items: {
                  some: {
                    productId: product.productId,
                  },
                },
                createdAt: { gte: startDate, lte: endDate },
                paymentStatus: 'SUCCEEDED',
              },
              select: {
                totalCents: true,
              },
            }),
          ]);

          // Calculer conversion rate
          const conversionRate = designsCount > 0
            ? (ordersData.length / designsCount) * 100
            : 0;

          // Calculer revenue
          const revenue = ordersData.reduce(
            (sum, order) => sum + (typeof order.totalCents === 'number' ? order.totalCents : 0),
            0,
          ) / 100; // Convertir cents en euros

          return {
            productId: product.productId,
            name: product.name ?? 'Produit inconnu',
            designs: designsCount,
            orders: ordersData.length,
            conversionRate: Math.round(conversionRate * 100) / 100,
            revenue: Math.round(revenue * 100) / 100,
          };
        }),
      );

      // ✅ Filtrer les nulls et trier par score (conversion * revenue)
      const validStats = productStats.filter(
        (stat): stat is NonNullable<typeof stat> => stat !== null,
      );

      // ✅ Calculer un score de recommandation (conversion * revenue * designs)
      const scoredProducts = validStats.map((stat) => ({
        ...stat,
        score: stat.conversionRate * stat.revenue * stat.designs,
      }));

      // ✅ Trier par score décroissant et prendre les top 3
      const topScored = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (topScored.length === 0) {
        return {
          recommendations: [],
          note: 'Aucun produit avec conversion/revenue détecté.',
        };
      }

      // ✅ Générer recommandations basées sur conversion + revenue
      return {
        recommendations: topScored.map((product) => {
          let suggestion = '';
          let reason = '';

          if (product.conversionRate > 10 && product.revenue > 100) {
            suggestion = `⭐ Produit star : ${product.name} - Augmenter le stock et la visibilité`;
            reason = `${product.conversionRate}% conversion, €${product.revenue} revenus, ${product.designs} designs`;
          } else if (product.conversionRate > 5) {
            suggestion = `📈 Produit performant : ${product.name} - Optimiser le prix ou la description`;
            reason = `${product.conversionRate}% conversion, €${product.revenue} revenus`;
          } else if (product.designs > 50 && product.conversionRate < 3) {
            suggestion = `🔧 Produit à optimiser : ${product.name} - Améliorer le parcours de conversion`;
            reason = `${product.designs} designs mais seulement ${product.conversionRate}% conversion`;
          } else {
            suggestion = `💡 Produit prometteur : ${product.name} - Tester de nouvelles campagnes`;
            reason = `${product.designs} designs, ${product.conversionRate}% conversion`;
          }

          return {
            productId: product.productId,
            category: product.name,
            suggestion,
            reason,
            metrics: {
              designs: product.designs,
              orders: product.orders,
              conversionRate: product.conversionRate,
              revenue: product.revenue,
            },
          };
        }),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get product recommendations: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return {
        recommendations: [],
        note: 'Erreur lors du calcul des recommandations.',
      };
    }
  }

  /**
   * Récupère les données de tendances avec typage strict
   */
  private async getTrendsData(brandId: string): Promise<TrendsData> {
    const [trendPredictions, seasonalEvents, anomalies, recommendations] = await Promise.all([
      this.predictiveService.getTrendPredictions(brandId, '30d'),
      this.predictiveService.getUpcomingSeasonalEvents(brandId),
      this.predictiveService.detectAnomalies(brandId),
      this.predictiveService.getRecommendations(brandId),
    ]);

    return {
      trends: trendPredictions ?? null,
      seasonalEvents: seasonalEvents ?? null,
      anomalies: anomalies ?? null,
      recommendations: recommendations ?? null,
    };
  }

  /**
   * Récupère les templates de configuration avec typage strict
   */
  private async getConfigurationTemplates(brandId: string): Promise<ConfigurationTemplatesData> {
    const fieldLabels: Record<string, string> = {
      TEXT: 'texte',
      IMAGE: 'image',
      COLOR: 'couleur',
      PATTERN: 'motif',
      FONT: 'police',
      SIZE: 'taille',
      POSITION: 'position',
    };

    const products = await this.prisma.product.findMany({
      where: {
        brandId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        customizationZones: {
          select: {
            id: true,
            name: true,
            type: true,
            maxLength: true,
            allowedFonts: true,
            allowedColors: true,
          },
        },
      },
    });

    // ✅ Garde pour éviter les crashes si products est null/undefined
    if (!products || products.length === 0) {
      return { templates: [] };
    }

    const templates = products.map((product) => {
      const fields = (product.customizationZones ?? []).map((zone) => {
        return fieldLabels[zone.type] || zone.type.toLowerCase();
      });
      const uniqueFields = Array.from(new Set(fields));

      return {
        id: product.id ?? '',
        name: product.name ?? 'Produit sans nom',
        fields: uniqueFields,
        zones: (product.customizationZones ?? []).map((zone) => ({
          id: zone.id ?? '',
          name: zone.name ?? '',
          type: zone.type ?? '',
          maxLength: zone.maxLength ?? null,
          allowedFonts: zone.allowedFonts ?? null,
          allowedColors: zone.allowedColors ?? null,
        })),
      };
    });

    return { templates };
  }

  /**
   * Formate l'historique de conversation pour le prompt
   */
  private formatHistory(history: Array<{ role: string; content: string }>): string {
    if (history.length === 0) return 'Aucun historique';

    return history
      .map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Luna'}: ${msg.content}`)
      .join('\\n\\n');
  }

  /**
   * Parse la réponse du LLM et extrait les actions
   * Amélioré pour parser du JSON structuré si présent
   */
  private parseResponse(
    content: string,
    intent: LunaIntentType,
    data: LunaIntentData,
  ): {
    message: string;
    actions: LunaAction[];
    suggestions: string[];
  } {
    const actions: LunaAction[] = [];
    const suggestions: string[] = [];

    // Essayer de parser du JSON structuré dans la réponse
    let parsedContent: { message?: string; actions?: unknown[]; suggestions?: string[] } | null = null;
    
    // Chercher un bloc JSON dans la réponse (entre ```json et ``` ou { ... })
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*"actions"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (error) {
        this.logger.warn(
          `Failed to parse Luna LLM response JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    // Utiliser le contenu parsé si disponible, sinon utiliser le contenu brut
    const message = parsedContent?.message || content.split('```')[0].trim();

    // Parser les actions depuis le JSON si disponible
    if (parsedContent?.actions && Array.isArray(parsedContent.actions)) {
      for (const action of parsedContent.actions) {
        if (typeof action === 'object' && action !== null && 'type' in action) {
          const actionObj = action as Record<string, unknown>;
          actions.push({
            type: actionObj.type as LunaAction['type'],
            label: (actionObj.label as string) || 'Action',
            payload: (actionObj.payload as Record<string, unknown>) || {},
            requiresConfirmation: (actionObj.requiresConfirmation as boolean) || false,
          });
        }
      }
    }

    // Parser les suggestions depuis le JSON si disponible
    if (parsedContent?.suggestions && Array.isArray(parsedContent.suggestions)) {
      suggestions.push(...parsedContent.suggestions.map(s => String(s)));
    }

    // Générer des actions basées sur l'intention si aucune action n'a été parsée
    if (actions.length === 0) {
      switch (intent) {
        case LunaIntentType.ANALYZE_SALES:
          {
            const period = this.isAnalyticsData(data) ? data.period : undefined;
          actions.push({
            type: 'generate_report',
            label: '📊 Générer un rapport complet',
              payload: { type: 'sales', dateRange: period },
            requiresConfirmation: false,
          });
          }
          if (suggestions.length === 0) {
            suggestions.push(
              'Voir le détail par produit',
              'Comparer avec le mois précédent',
              'Exporter en PDF',
            );
          }
          break;

        case LunaIntentType.CONFIGURE_PRODUCT:
          actions.push({
            type: 'create_product',
            label: '✨ Créer ce produit',
            payload: { template: 'new-product' },
            requiresConfirmation: true,
          });
          break;

        case LunaIntentType.RECOMMEND_PRODUCTS:
          if (suggestions.length === 0) {
            suggestions.push(
              'Voir les tendances du marché',
              'Configurer un nouveau produit',
              'Analyser mes ventes',
            );
          }
          break;
      }
    }

    return {
      message,
      actions,
      suggestions,
    };
  }

  /**
   * Type guard pour vérifier si les données sont de type AnalyticsData
   * Validation stricte avec vérification de toutes les propriétés requises
   */
  private isAnalyticsData(data: LunaIntentData): data is AnalyticsData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // ✅ Vérification stricte des propriétés requises
    const hasPeriod = 'period' in data && typeof (data as Partial<AnalyticsData>).period === 'object';
    const hasKpis = 'kpis' in data && typeof (data as Partial<AnalyticsData>).kpis === 'object';
    const hasRealTime = 'realTime' in data;
    const hasCharts = 'charts' in data;
    const hasTopProducts = 'topProducts' in data;
    const hasFunnel = 'funnel' in data;

    return Boolean(hasPeriod && hasKpis && hasRealTime && hasCharts && hasTopProducts && hasFunnel);
  }

  /**
   * Structure recentData en pack BI selon le plan PHASE 1 - A) Luna
   * Unifie les données analytics en un format structuré pour BI
   */
  private structureBIPack(
    data: LunaIntentData,
    intent: LunaIntentType,
    brandId: string,
  ): {
    intent: LunaIntentType;
    timestamp: string;
    summary: {
      type: string;
      keyMetrics: Record<string, unknown>;
      insights: string[];
    };
    detailed: LunaIntentData;
  } {
    const insights: string[] = [];

    // ✅ Générer insights selon le type de données
    if (this.isAnalyticsData(data)) {
      insights.push(`📊 ${data.kpis.totalDesigns} designs créés`);
      insights.push(`💰 €${data.kpis.revenue} de revenus`);
      insights.push(`📈 ${data.kpis.conversionRate}% de conversion`);
      if (data.kpis.conversionChange > 0) {
        insights.push(`✅ Conversion en hausse de ${data.kpis.conversionChange}%`);
      } else if (data.kpis.conversionChange < 0) {
        insights.push(`⚠️ Conversion en baisse de ${Math.abs(data.kpis.conversionChange)}%`);
      }
      if (data.topProducts && data.topProducts.length > 0) {
        insights.push(`🏆 Top produit: ${data.topProducts[0].name}`);
      }
    } else if ('recommendations' in data && Array.isArray(data.recommendations)) {
      insights.push(`💡 ${data.recommendations.length} recommandations produits`);
      if (data.recommendations.length > 0 && data.recommendations[0].metrics) {
        const topRec = data.recommendations[0];
        insights.push(
          `⭐ ${topRec.category}: ${topRec.metrics.conversionRate}% conversion, €${topRec.metrics.revenue} revenus`,
        );
      }
    } else if ('trends' in data && data.trends && Array.isArray(data.trends)) {
      insights.push(`📈 ${data.trends.length} tendances détectées`);
      if (data.anomalies && Array.isArray(data.anomalies) && data.anomalies.length > 0) {
        insights.push(`⚠️ ${data.anomalies.length} anomalies détectées`);
      }
      if (data.seasonalEvents && Array.isArray(data.seasonalEvents) && data.seasonalEvents.length > 0) {
        insights.push(`📅 ${data.seasonalEvents.length} événements saisonniers à venir`);
      }
    }

    return {
      intent,
      timestamp: new Date().toISOString(),
      summary: {
        type: intent,
        keyMetrics: this.extractKeyMetrics(data, intent),
        insights,
      },
      detailed: data,
    };
  }

  /**
   * Extrait les métriques clés selon le type de données
   */
  private extractKeyMetrics(data: LunaIntentData, intent: LunaIntentType): Record<string, unknown> {
    if (this.isAnalyticsData(data)) {
      return {
        totalDesigns: data.kpis.totalDesigns,
        revenue: data.kpis.revenue,
        conversionRate: data.kpis.conversionRate,
        activeUsers: data.kpis.activeUsers,
        topProductsCount: data.topProducts.length,
      };
    }

    if ('recommendations' in data && Array.isArray(data.recommendations)) {
      return {
        recommendationsCount: data.recommendations.length,
        topProductId: data.recommendations[0]?.productId,
      };
    }

    if ('trends' in data) {
      return {
        trendsCount: Array.isArray(data.trends) ? data.trends.length : 0,
        anomaliesCount: Array.isArray(data.anomalies) ? data.anomalies.length : 0,
        seasonalEventsCount: Array.isArray(data.seasonalEvents) ? data.seasonalEvents.length : 0,
      };
    }

    return {};
  }

  /**
   * Exécute une action proposée par Luna
   */
  async executeAction(
    brandId: string,
    userId: string,
    action: LunaAction,
    currentUser: CurrentUser,
  ): Promise<{ success: boolean; result: unknown }> {
    this.logger.log(`Executing Luna action: ${action.type} for brand ${brandId}`);

    try {
      switch (action.type) {
        case 'generate_report': {
          const dateRange = action.payload.dateRange as { start: string; end: string } | undefined;
          const reportType = (action.payload.type as 'sales' | 'analytics' | 'products') || 'analytics';
          
          const start = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const end = dateRange?.end ? new Date(dateRange.end) : new Date();

          const report = await this.reportsService.generatePDFReport(
            brandId,
            { start, end },
            reportType,
          );

          return { success: true, result: report };
        }

        case 'create_product': {
          const productData = action.payload.productData as Record<string, unknown> | undefined;
          
          if (!productData) {
            return { success: false, result: { error: 'Données produit manquantes' } };
          }

          const product = await this.productsService.create(
            brandId,
            productData as Record<string, any>,
            currentUser,
          );

          return { success: true, result: { productId: product.id, product } };
        }

        case 'update_product': {
          const productId = action.payload.productId as string | undefined;
          const updateData = action.payload.updateData as Record<string, unknown> | undefined;

          if (!productId || !updateData) {
            return { success: false, result: { error: 'ID produit ou données manquantes' } };
          }

          const product = await this.productsService.update(
            brandId,
            productId,
            updateData as Record<string, any>,
            currentUser,
          );

          return { success: true, result: { productId: product.id, product } };
        }

        case 'navigate': {
          const url = action.payload.url as string | undefined;
          if (!url) {
            return { success: false, result: { error: 'URL manquante' } };
          }
          return { success: true, result: { url } };
        }

        case 'configure': {
          // Action de configuration - retourner les options disponibles
          return { success: true, result: { message: 'Configuration disponible', options: action.payload } };
        }

        default:
          return { success: false, result: { error: 'Action non supportée' } };
      }
    } catch (error) {
      this.logger.error(`Action execution error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return { success: false, result: { error: 'Erreur lors de l\'exécution' } };
    }
  }

  /**
   * Récupère les conversations d'un utilisateur
   */
  async getConversations(brandId: string, userId: string): Promise<Array<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessage?: string;
    messageCount: number;
  }>> {
    const conversations = await this.prisma.agentConversation.findMany({
      where: {
        brandId,
        userId,
        agentType: 'luna',
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return conversations.map(conv => ({
      id: conv.id,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage: conv.messages[0]?.content,
      messageCount: conv._count.messages,
    }));
  }
}
