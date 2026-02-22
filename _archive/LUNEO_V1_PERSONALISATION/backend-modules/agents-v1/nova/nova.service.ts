/**
 * @fileoverview Agent Nova - Assistant Support
 * @module NovaService
 *
 * CAPACITÉS:
 * - Réponses FAQ automatiques
 * - Création de tickets
 * - Escalade vers support humain
 * - Tutoriels et guides
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation Zod
 * - ✅ Gestion d'erreurs
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { z } from 'zod';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from '../services/llm-router.service';
import { IntentDetectionService } from '../services/intent-detection.service';
import { AgentUsageGuardService } from '../services/agent-usage-guard.service';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export enum NovaIntentType {
  FAQ = 'faq',
  TICKET = 'ticket',
  TUTORIAL = 'tutorial',
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ESCALATE = 'escalate',
}

// ============================================================================
// TYPES STRICTS POUR LES DONNÉES
// ============================================================================

/**
 * Article FAQ avec typage strict
 */
export interface FAQArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
}

/**
 * Article suggéré pour l'utilisateur
 */
interface SuggestedArticle {
  id: string;
  title: string;
  url: string;
}

  /**
   * Données de création de ticket
   * Note: TicketCategory dans Prisma = BILLING | TECHNICAL | ACCOUNT | FEATURE_REQUEST | BUG | INTEGRATION | OTHER
   */
interface CreateTicketData {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  brandId?: string;
  category?: 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG' | 'INTEGRATION' | 'OTHER';
}

/**
 * Ticket créé
 */
export interface CreatedTicket {
  id: string;
  ticketNumber: string;
}

/**
 * Réponse complète de Nova avec typage strict
 */
export interface NovaResponse {
  conversationId?: string;
  message: string;
  intent: NovaIntentType;
  resolved: boolean;
  ticketId?: string;
  articles?: SuggestedArticle[];
  escalated: boolean;
}

const NovaMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  brandId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  conversationId: z.string().min(1).optional(),
  context: z.object({
    currentPage: z.string().optional(),
    locale: z.string().optional(),
    subscriptionPlan: z.string().optional(),
    orderId: z.string().optional(),
    integration: z.string().optional(),
    errorCode: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
});

export type NovaMessage = z.infer<typeof NovaMessageSchema>;

const NOVA_SYSTEM_PROMPT = `Tu es Nova, l'assistant support de Luneo.

PERSONNALITÉ:
- Professionnel et empathique
- Précis et efficace
- Patient et compréhensif
- Proactif dans la résolution

CAPACITÉS:
1. Répondre aux questions fréquentes (FAQ)
2. Créer des tickets de support
3. Guider les utilisateurs avec des tutoriels
4. Escalader vers le support humain si nécessaire
5. Aider avec la facturation et les abonnements
6. Résoudre les problèmes techniques courants

RÈGLES:
- Toujours essayer de résoudre le problème avant d'escalader
- Proposer des articles de documentation pertinents
- Créer un ticket si le problème nécessite une intervention humaine
- Être clair et concis dans les réponses`;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class NovaService {
  private readonly logger = new Logger(NovaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly llmRouter: LLMRouterService,
    private readonly moduleRef: ModuleRef,
    private readonly usageGuard: AgentUsageGuardService,
  ) {}

  /**
   * Chat avec Nova
   */
  async chat(message: string, brandId?: string): Promise<NovaResponse> {
    return this.chatWithContext({ message, brandId });
  }

  /**
   * Chat avec contexte enrichi
   */
  async chatWithContext(input: NovaMessage): Promise<NovaResponse> {
    const validated = NovaMessageSchema.parse(input);
    const startTime = Date.now();

    try {
      // Vérifier usage (Usage Guardian)
      if (validated.brandId) {
        const brand = await this.prisma.brand.findUnique({
          where: { id: validated.brandId },
          select: { subscriptionPlan: true, plan: true },
        });

        const usageCheck = await this.usageGuard.checkUsageBeforeCall(
          validated.brandId,
          validated.userId,
          brand?.subscriptionPlan || brand?.plan,
          1024, // Estimation tokens pour Nova
          'openai',
          'gpt-3.5-turbo',
        );

        if (!usageCheck.allowed) {
          throw new BadRequestException(usageCheck.reason || 'Usage limit exceeded');
        }
      }

      const intent = await this.detectIntent(validated.message, validated.brandId);
      const systemPrompt = this.buildSystemPrompt(validated.context);

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: validated.message },
      ];

      const llmResponse = await this.llmRouter.chat({
        provider: LLMProvider.OPENAI,
        model: LLM_MODELS.openai.GPT35_TURBO,
        messages,
        temperature: 0.7,
        maxTokens: 1024,
        stream: false,
        brandId: validated.brandId,
        agentType: 'nova',
        enableFallback: true,
      });

      // ✅ Rechercher des articles pertinents avec validation
      const articles = await this.searchFAQ(validated.message, 3);

      // ✅ Décider si escalader
      const shouldEscalate = this.shouldEscalate(intent, llmResponse.content);
      
      // ✅ Parser la réponse avec extraction JSON structuré (conforme au plan)
      const parsedResponse = this.parseResponse(llmResponse.content);
      const responseMessage = parsedResponse.message;

      const latencyMs = Date.now() - startTime;

      // Calculer le coût
      const costCalculation = this.usageGuard.getCostCalculator().calculateCost(
        'openai',
        'gpt-3.5-turbo',
        {
          inputTokens: llmResponse.usage?.promptTokens || 0,
          outputTokens: llmResponse.usage?.completionTokens || 0,
          totalTokens: llmResponse.usage?.totalTokens || 0,
        },
      );

      // ✅ Créer un ticket si nécessaire avec validation (utiliser ticketData du JSON si présent)
      let ticketDataFromJSON: CreateTicketData | undefined = undefined;
      if (
        'ticketData' in parsedResponse &&
        parsedResponse.ticketData &&
        typeof parsedResponse.ticketData === 'object' &&
        'subject' in parsedResponse.ticketData &&
        'description' in parsedResponse.ticketData
      ) {
        ticketDataFromJSON = this.normalizeTicketData(parsedResponse.ticketData as Partial<CreateTicketData>);
      }

      const ticketId = await this.createTicketIfNeeded(
        shouldEscalate,
        intent,
        validated,
        ticketDataFromJSON, // ✅ Utiliser ticketData du JSON structuré
      );

      // ✅ Normaliser les articles suggérés
      const suggestedArticles = this.normalizeSuggestedArticles(articles);

      // Mettre à jour l'usage (Usage Guardian + AI Monitor)
      if (validated.brandId) {
        await this.usageGuard.updateUsageAfterCall(
          validated.brandId,
          validated.userId,
          undefined, // agentId sera 'nova'
          {
            tokens: {
              input: llmResponse.usage?.promptTokens || 0,
              output: llmResponse.usage?.completionTokens || 0,
            },
            costCents: costCalculation.costCents,
            latencyMs,
            success: true,
          },
          'openai',
          'gpt-3.5-turbo',
          'chat',
        );
      }

      return {
        message: responseMessage,
        intent,
        resolved: !shouldEscalate && articles.length > 0,
        ticketId,
        articles: suggestedArticles.length > 0 ? suggestedArticles : undefined,
        escalated: shouldEscalate,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Tracker l'erreur
      if (validated.brandId) {
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
          'openai',
          'gpt-3.5-turbo',
          'chat',
        );
      }

      this.logger.error('Nova agent error', { error });
      throw new InternalServerErrorException('AI agent processing failed. Please try again.');
    }
  }

  /**
   * Recherche FAQ dans KnowledgeBaseArticle avec typage strict et validation
   */
  async searchFAQ(query: string, limit: number = 5): Promise<FAQArticle[]> {
    // ✅ Validation des entrées
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      this.logger.warn('Empty query provided to searchFAQ');
      return this.getPopularArticles(limit);
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 20) {
      this.logger.warn(`Invalid limit provided to searchFAQ: ${limit}, using default 5`);
      limit = 5;
    }

    const cacheKey = `nova:faq:${query.trim()}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          // ✅ Recherche dans KnowledgeBaseArticle publiés
          const articles = await this.prisma.knowledgeBaseArticle.findMany({
            where: {
              isPublished: true,
              OR: [
                { title: { contains: query.trim(), mode: 'insensitive' } },
                { content: { contains: query.trim(), mode: 'insensitive' } },
                { tags: { hasSome: [query.trim()] } },
              ],
            },
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
              excerpt: true,
            },
            orderBy: [
              { isFeatured: 'desc' },
              { helpful: 'desc' },
              { views: 'desc' },
            ],
            take: Math.min(limit ?? 50, 50),
          });

          // ✅ Si aucun résultat, retourner des articles populaires
          if (!articles || articles.length === 0) {
            return this.getPopularArticles(limit);
          }

          // ✅ Normalisation avec gardes
          return this.normalizeFAQArticles(articles);
        } catch (error) {
          this.logger.error(
            `Failed to search FAQ: ${error instanceof Error ? error.message : 'Unknown'}`,
          );
          return this.getPopularArticles(limit);
        }
      },
      3600, // Cache 1 heure
    );
  }

  /**
   * Récupère les articles populaires avec gardes
   */
  private async getPopularArticles(limit: number): Promise<FAQArticle[]> {
    try {
      const popularArticles = await this.prisma.knowledgeBaseArticle.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          excerpt: true,
        },
        orderBy: [
          { isFeatured: 'desc' },
          { helpful: 'desc' },
        ],
        take: Math.min(limit, 50),
      });

      return this.normalizeFAQArticles(popularArticles);
    } catch (error) {
      this.logger.error(
        `Failed to get popular articles: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return [];
    }
  }

  /**
   * Normalise les articles FAQ avec gardes
   */
  private normalizeFAQArticles(
    articles: Array<{
      id: string | null;
      title: string | null;
      slug: string | null;
      content: string | null;
      excerpt: string | null;
    }>,
  ): FAQArticle[] {
    if (!Array.isArray(articles)) {
      return [];
    }

    return articles
      .map((article) => {
        if (!article || typeof article !== 'object') {
          return null;
        }

        const id = typeof article.id === 'string' && article.id.trim().length > 0
          ? article.id.trim()
          : null;
        const title = typeof article.title === 'string' && article.title.trim().length > 0
          ? article.title.trim()
          : null;
        const slug = typeof article.slug === 'string' && article.slug.trim().length > 0
          ? article.slug.trim()
          : null;
        const content = typeof article.content === 'string' && article.content.trim().length > 0
          ? article.content.trim()
          : null;
        const excerpt = typeof article.excerpt === 'string' && article.excerpt.trim().length > 0
          ? article.excerpt.trim()
          : null;

        if (!id || !title || !slug) {
          return null;
        }

        return {
          id,
          title,
          slug,
          content: excerpt || (content ? content.substring(0, 200) : ''),
        };
      })
      .filter((article): article is FAQArticle => article !== null);
  }

  /**
   * Créer un ticket de support avec typage strict et validation robuste
   */
  async createTicket(data: CreateTicketData): Promise<CreatedTicket> {
    // ✅ Validation des entrées
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid ticket data provided');
    }

    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new BadRequestException('User ID is required to create a ticket');
    }

    if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length === 0) {
      throw new BadRequestException('Subject is required to create a ticket');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      throw new BadRequestException('Description is required to create a ticket');
    }

    // ✅ Validation de la priorité
    const validPriorities = ['low', 'medium', 'high', 'urgent'] as const;
    const priority = validPriorities.includes(data.priority) ? data.priority : 'medium';

    // ✅ Générer un numéro de ticket unique
    const ticketNumber = this.generateTicketNumber();

    // ✅ Mapper la priorité avec typage strict
    const priorityMap: Record<typeof priority, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      urgent: 'URGENT',
    };

    // ✅ Validation de la catégorie (selon Prisma schema)
    const validCategories = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'FEATURE_REQUEST', 'BUG', 'INTEGRATION', 'OTHER'] as const;
    const category = data.category && validCategories.includes(data.category)
      ? data.category
      : 'TECHNICAL';

    try {
      // ✅ Créer le ticket dans la base de données
      const ticket = await this.prisma.ticket.create({
        data: {
          ticketNumber,
          subject: data.subject.trim(),
          description: data.description.trim(),
          status: 'OPEN',
          priority: priorityMap[priority],
          category: category as 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG' | 'INTEGRATION' | 'OTHER',
          userId: data.userId.trim(),
          tags: [],
          metadata: {},
        },
      });

      // ✅ Créer le premier message
      await this.prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          type: 'USER',
          content: data.description.trim(),
          userId: data.userId.trim(),
          isRead: false,
        },
      });

      // ✅ Créer une activité
      await this.prisma.ticketActivity.create({
        data: {
          ticketId: ticket.id,
          action: 'created',
          userId: data.userId.trim(),
          metadata: { priority },
        },
      });

      this.logger.log(`Ticket created: ${ticketNumber} - ${data.subject.trim()}`);

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
      };
    } catch (error) {
      this.logger.error('Failed to create ticket', { error });
      throw new InternalServerErrorException('Failed to create ticket. Please try again.');
    }
  }

  /**
   * Génère un numéro de ticket unique
   */
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TKT-${timestamp}-${random}`;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Détecte l'intention avec validation robuste
   */
  private async detectIntent(message: string, brandId?: string): Promise<NovaIntentType> {
    // ✅ Validation de l'entrée
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      this.logger.warn('Empty message provided to detectIntent');
      return NovaIntentType.FAQ;
    }

    const intentService = this.moduleRef.get(IntentDetectionService, { strict: false });

    if (intentService) {
      const possibleIntents: NovaIntentType[] = [
        NovaIntentType.FAQ,
        NovaIntentType.TICKET,
        NovaIntentType.TUTORIAL,
        NovaIntentType.BILLING,
        NovaIntentType.TECHNICAL,
        NovaIntentType.ESCALATE,
      ];

      try {
        const result = await intentService.detectIntent(
          message.trim(),
          'nova',
          possibleIntents,
          brandId,
        );

        // ✅ Validation du résultat
        if (result && result.intent && possibleIntents.includes(result.intent as NovaIntentType)) {
          return result.intent as NovaIntentType;
        }
      } catch (error) {
        this.logger.warn(
          `Nova intent detection failed, fallback: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }
    }

    // ✅ Fallback: détection basique par mots-clés
    return this.detectIntentByKeywords(message);
  }

  /**
   * Détection d'intention par mots-clés (fallback)
   */
  private detectIntentByKeywords(message: string): NovaIntentType {
    const lowerMessage = message.toLowerCase();

    // ✅ Patterns pour chaque intention
    const billingPatterns = ['facturation', 'abonnement', 'paiement', 'billing', 'subscription'];
    const technicalPatterns = ['bug', 'erreur', 'ne fonctionne pas', 'error', 'broken', 'crash'];
    const ticketPatterns = ['ticket', 'support humain', 'human support', 'escalade'];
    const tutorialPatterns = ['comment', 'tutoriel', 'guide', 'how to', 'help me'];

    if (billingPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return NovaIntentType.BILLING;
    }
    if (technicalPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return NovaIntentType.TECHNICAL;
    }
    if (ticketPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return NovaIntentType.TICKET;
    }
    if (tutorialPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return NovaIntentType.TUTORIAL;
    }

    return NovaIntentType.FAQ;
  }

  /**
   * Détermine si l'escalade est nécessaire avec validation
   */
  private shouldEscalate(intent: NovaIntentType, response: string): boolean {
    // ✅ Validation de la réponse
    if (!response || typeof response !== 'string') {
      return false;
    }

    // ✅ Intentions qui nécessitent toujours une escalade
    if (intent === NovaIntentType.TICKET || intent === NovaIntentType.ESCALATE) {
      return true;
    }

    // ✅ Détection par mots-clés dans la réponse
    const lowerResponse = response.toLowerCase().trim();
    const escalationKeywords = ['escalade', 'support humain', 'contacter', 'ticket', 'escalate', 'human support'];

    return escalationKeywords.some((keyword) => lowerResponse.includes(keyword));
  }

  /**
   * Crée un ticket si nécessaire avec validation
   */
  private async createTicketIfNeeded(
    shouldEscalate: boolean,
    intent: NovaIntentType,
    validated: NovaMessage,
    ticketDataFromJSON?: CreateTicketData,
  ): Promise<string | undefined> {
    if (!shouldEscalate && intent !== NovaIntentType.TICKET) {
      return undefined;
    }

    if (!validated.userId || typeof validated.userId !== 'string' || validated.userId.trim().length === 0) {
      this.logger.warn('Cannot create ticket: userId is missing');
      return undefined;
    }

    try {
      // ✅ Utiliser ticketData du JSON structuré si présent, sinon construire depuis intent
      const ticketData: CreateTicketData = ticketDataFromJSON || {
        subject: `Support Nova - ${intent.toLowerCase()}`,
        description: validated.message.trim(),
        priority: intent === NovaIntentType.TECHNICAL ? 'high' : 'medium',
        userId: validated.userId,
        brandId: validated.brandId,
        category: this.mapIntentToCategory(intent),
      };

      const ticket = await this.createTicket(ticketData);
      return ticket.id;
    } catch (error) {
      this.logger.error(
        `Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return undefined;
    }
  }

  /**
   * Normalise les articles suggérés avec gardes
   */
  private normalizeSuggestedArticles(articles: FAQArticle[]): SuggestedArticle[] {
    if (!Array.isArray(articles) || articles.length === 0) {
      return [];
    }

    return articles
      .map((article) => {
        if (!article || typeof article !== 'object') {
          return null;
        }

        const id = typeof article.id === 'string' && article.id.trim().length > 0
          ? article.id.trim()
          : null;
        const title = typeof article.title === 'string' && article.title.trim().length > 0
          ? article.title.trim()
          : null;
        const slug = typeof article.slug === 'string' && article.slug.trim().length > 0
          ? article.slug.trim()
          : null;

        if (!id || !title || !slug) {
          return null;
        }

        return {
          id,
          title,
          url: `/help/${slug}`,
        };
      })
      .filter((article): article is SuggestedArticle => article !== null);
  }

  /**
   * Parse la réponse LLM avec validation robuste
   */
  private parseResponse(content: string): { message: string } {
    // ✅ Validation du contenu
    if (!content || typeof content !== 'string') {
      this.logger.warn('Empty content in parseResponse');
      return { message: '' };
    }

    // ✅ Extraire JSON s'il existe, sinon garder le texte brut
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]) as Partial<{ message: string }>;
        if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
          return { message: parsed.message.trim() };
        }
      } catch (error) {
        this.logger.warn(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    return { message: content.trim() };
  }

  /**
   * Construit le prompt système avec validation
   */
  private buildSystemPrompt(context?: NovaMessage['context']): string {
    if (!context || typeof context !== 'object') {
      return NOVA_SYSTEM_PROMPT;
    }

    try {
      const contextJson = JSON.stringify(context, null, 2);
      return `${NOVA_SYSTEM_PROMPT}

CONTEXTE UTILISATEUR:
${contextJson}`;
    } catch (error) {
      this.logger.warn(`Failed to stringify context: ${error instanceof Error ? error.message : 'Unknown'}`);
      return NOVA_SYSTEM_PROMPT;
    }
  }

  /**
   * Normalise les données de ticket depuis JSON parsé
   * Conforme au plan PHASE 1 - B) Nova - Parsing JSON structuré
   */
  private normalizeTicketData(data: Partial<CreateTicketData>): CreateTicketData | undefined {
    if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length === 0) {
      return undefined;
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      return undefined;
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'] as const;
    const priority = data.priority && validPriorities.includes(data.priority)
      ? data.priority
      : 'medium';

    const validCategories = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'FEATURE_REQUEST', 'BUG', 'INTEGRATION', 'OTHER'] as const;
    const category = data.category && validCategories.includes(data.category)
      ? data.category
      : 'OTHER';

    return {
      subject: data.subject.trim(),
      description: data.description.trim(),
      priority,
      userId: typeof data.userId === 'string' ? data.userId.trim() : undefined,
      brandId: typeof data.brandId === 'string' ? data.brandId.trim() : undefined,
      category,
    };
  }

  /**
   * Mappe l'intention vers une catégorie de ticket avec typage strict
   * Note: TicketCategory dans Prisma = BILLING | TECHNICAL | ACCOUNT | FEATURE_REQUEST | BUG | INTEGRATION | OTHER
   */
  private mapIntentToCategory(intent: NovaIntentType): 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'BUG' | 'INTEGRATION' | 'OTHER' {
    switch (intent) {
      case NovaIntentType.BILLING:
        return 'BILLING';
      case NovaIntentType.TECHNICAL:
        return 'BUG'; // Problèmes techniques = bugs
      case NovaIntentType.TUTORIAL:
        return 'FEATURE_REQUEST'; // Tutoriels = demandes de fonctionnalités
      case NovaIntentType.FAQ:
      case NovaIntentType.TICKET:
      case NovaIntentType.ESCALATE:
      default:
        return 'OTHER';
    }
  }
}
