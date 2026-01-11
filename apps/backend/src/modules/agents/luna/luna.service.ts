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

import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { z } from 'zod';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from '../services/llm-router.service';
import { ConversationService } from '../services/conversation.service';
import { AgentMemoryService } from '../services/agent-memory.service';
import { ProductsService } from '@/modules/products/products.service';
import { ReportsService } from '@/modules/analytics/services/reports.service';
import { IntentDetectionService } from '../services/intent-detection.service';
import { ContextManagerService } from '../services/context-manager.service';
import { RAGService } from '../services/rag.service';
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
  data?: Record<string, unknown>;
  suggestions: string[];
}

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
    private readonly moduleRef: ModuleRef,
    private readonly ragService: RAGService,
  ) {}

  /**
   * Traite un message utilisateur et génère une réponse
   */
  async chat(input: LunaUserMessage): Promise<LunaResponse> {
    // ✅ RÈGLE: Validation Zod
    const validated = UserMessageSchema.parse(input);

    try {
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

      // 4. Récupérer les données récentes selon l'intention
      const recentData = await this.getRelevantData(validated.brandId, intent, validated.context);

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
            .replace('{recentData}', JSON.stringify(recentData, null, 2))
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
        brandId: validated.brandId,
        agentType: 'luna',
        enableFallback: true,
      });

      // 8. Parser la réponse et extraire les actions
      const { message, actions, suggestions } = this.parseResponse(
        llmResponse.content,
        intent,
        recentData,
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
        lastDataAccessed: Object.keys(recentData),
      });

      return {
        conversationId: conversation.id,
        message,
        intent,
        confidence: 0.95, // TODO: Calculer dynamiquement
        actions,
        data: recentData,
        suggestions,
      };
    } catch (error) {
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

    // Fallback: détection basique par mots-clés
    const lowerMessage = message.toLowerCase();
    // TODO: Utiliser un classifieur ML pour plus de précision
    if (lowerMessage.includes('vente') || lowerMessage.includes('chiffre')) {
      return LunaIntentType.ANALYZE_SALES;
    }
    if (lowerMessage.includes('recommand') || lowerMessage.includes('suggère')) {
      return LunaIntentType.RECOMMEND_PRODUCTS;
    }
    if (lowerMessage.includes('prompt') || lowerMessage.includes('améliore')) {
      return LunaIntentType.OPTIMIZE_PROMPT;
    }
    if (lowerMessage.includes('tendance') || lowerMessage.includes('prévi')) {
      return LunaIntentType.PREDICT_TRENDS;
    }
    if (lowerMessage.includes('rapport') || lowerMessage.includes('export')) {
      return LunaIntentType.GENERATE_REPORT;
    }
    if (lowerMessage.includes('configur') || lowerMessage.includes('créer') || lowerMessage.includes('nouveau')) {
      return LunaIntentType.CONFIGURE_PRODUCT;
    }

    return LunaIntentType.GENERAL_QUESTION;
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
   * Récupère les données pertinentes selon l'intention
   */
  private async getRelevantData(
    brandId: string,
    intent: LunaIntentType,
    context?: LunaUserMessage['context'],
  ): Promise<Record<string, unknown>> {
    switch (intent) {
      case LunaIntentType.ANALYZE_SALES:
        return this.getAnalyticsData(brandId, context?.dateRange);

      case LunaIntentType.RECOMMEND_PRODUCTS:
        return this.getProductRecommendations(brandId);

      case LunaIntentType.PREDICT_TRENDS:
        return this.getTrendsData(brandId);

      case LunaIntentType.CONFIGURE_PRODUCT:
        return this.getConfigurationTemplates(brandId);

      default:
        return {};
    }
  }

  /**
   * Récupère les données analytics
   */
  private async getAnalyticsData(
    brandId: string,
    dateRange?: { start?: string; end?: string },
  ): Promise<Record<string, unknown>> {
    const startDate = dateRange?.start
      ? new Date(dateRange.start)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

    // Top produits personnalisés
    const topProducts = await this.prisma.design.groupBy({
      by: ['productId'],
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Total designs
    const totalDesigns = await this.prisma.design.count({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Designs par jour
    const designsByDay = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM "Design"
      WHERE brand_id = ${brandId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalDesigns,
      topProducts,
      designsByDay: designsByDay.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
    };
  }

  /**
   * Récupère les recommandations produits
   */
  private async getProductRecommendations(brandId: string): Promise<Record<string, unknown>> {
    // Logique de recommandation basée sur les tendances du marché
    // TODO: Implémenter ML-based recommendations
    return {
      recommendations: [
        {
          category: 'Bijoux',
          suggestion: 'Bracelet gravé avec prénom',
          reason: 'Les bijoux personnalisés avec prénoms ont +45% de conversion',
        },
        {
          category: 'Vêtements',
          suggestion: 'T-shirt avec illustration IA',
          reason: 'Tendance montante dans votre secteur',
        },
      ],
    };
  }

  /**
   * Récupère les données de tendances
   */
  private async getTrendsData(brandId: string): Promise<Record<string, unknown>> {
    // TODO: Implémenter l'analyse de tendances avec ML
    return {
      upcomingEvents: [
        { event: "Saint-Valentin", daysUntil: 45, expectedIncrease: "+340%" },
        { event: "Fête des Mères", daysUntil: 120, expectedIncrease: "+280%" },
      ],
      risingTrends: [
        { trend: "Coordonnées GPS", growth: "+67%" },
        { trend: "QR codes", growth: "+45%" },
      ],
    };
  }

  /**
   * Récupère les templates de configuration
   */
  private async getConfigurationTemplates(brandId: string): Promise<Record<string, unknown>> {
    return {
      templates: [
        {
          id: 'bracelet-grave',
          name: 'Bracelet gravé',
          fields: ['texte', 'police', 'couleur'],
        },
        {
          id: 'tshirt-custom',
          name: 'T-shirt personnalisé',
          fields: ['image', 'texte', 'position'],
        },
      ],
    };
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
    data: Record<string, unknown>,
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
      } catch {
        // Ignorer l'erreur de parsing
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
          actions.push({
            type: 'generate_report',
            label: '📊 Générer un rapport complet',
            payload: { type: 'sales', dateRange: data.period },
            requiresConfirmation: false,
          });
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
            productData as Record<string, unknown>,
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
            updateData as Record<string, unknown>,
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
