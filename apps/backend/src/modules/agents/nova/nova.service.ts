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

import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from '../services/llm-router.service';

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

export interface NovaResponse {
  conversationId?: string;
  message: string;
  intent: NovaIntentType;
  resolved: boolean;
  ticketId?: string;
  articles?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  escalated: boolean;
}

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
  ) {}

  /**
   * Chat avec Nova
   */
  async chat(message: string, brandId?: string): Promise<NovaResponse> {
    try {
      const intent = this.detectIntent(message);

      const messages: Message[] = [
        { role: 'system', content: NOVA_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ];

      const llmResponse = await this.llmRouter.chat({
        provider: LLMProvider.OPENAI,
        model: LLM_MODELS.openai.GPT35_TURBO,
        messages,
        temperature: 0.7,
        maxTokens: 1024,
        brandId: brandId,
        agentType: 'nova',
        enableFallback: true,
      });

      // Rechercher des articles pertinents
      const articles = await this.searchFAQ(message, 3);

      // Décider si escalader
      const shouldEscalate = this.shouldEscalate(intent, llmResponse.content);

      return {
        message: llmResponse.content,
        intent,
        resolved: !shouldEscalate && articles.length > 0,
        articles: articles.map(a => ({
          id: a.id,
          title: a.title,
          url: `/help/${a.slug}`,
        })),
        escalated: shouldEscalate,
      };
    } catch (error) {
      this.logger.error(`Nova chat error: ${error}`);
      throw error;
    }
  }

  /**
   * Recherche FAQ dans KnowledgeBaseArticle
   */
  async searchFAQ(query: string, limit: number = 5): Promise<Array<{ id: string; title: string; slug: string; content: string }>> {
    const cacheKey = `nova:faq:${query}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Recherche dans KnowledgeBaseArticle publiés
        const articles = await this.prisma.knowledgeBaseArticle.findMany({
          where: {
            isPublished: true,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
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
          take: limit,
        });

        // Si aucun résultat, retourner des articles populaires
        if (articles.length === 0) {
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
            take: limit,
          });

          return popularArticles.map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            content: a.excerpt || a.content.substring(0, 200),
          }));
        }

        return articles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          content: a.excerpt || a.content.substring(0, 200),
        }));
      },
      { ttl: 3600 },
    );
  }

  /**
   * Créer un ticket de support
   */
  async createTicket(data: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    userId?: string;
    brandId?: string;
    category?: 'TECHNICAL' | 'BILLING' | 'FEATURE' | 'OTHER';
  }): Promise<{ id: string; ticketNumber: string }> {
    if (!data.userId) {
      throw new Error('User ID is required to create a ticket');
    }

    // Générer un numéro de ticket unique
    const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

    // Mapper la priorité
    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      urgent: 'URGENT',
    };

    // Créer le ticket dans la base de données
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        status: 'OPEN',
        priority: priorityMap[data.priority] || 'MEDIUM',
        category: data.category || 'TECHNICAL',
        userId: data.userId,
        tags: [],
        metadata: {},
      },
    });

    // Créer le premier message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        type: 'USER',
        content: data.description,
        userId: data.userId,
        isRead: false,
      },
    });

    // Créer une activité
    await this.prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        action: 'created',
        userId: data.userId,
        metadata: { priority: data.priority },
      },
    });

    this.logger.log(`Ticket created: ${ticketNumber} - ${data.subject}`);

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
    };
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private detectIntent(message: string): NovaIntentType {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('facturation') || lowerMessage.includes('abonnement') || lowerMessage.includes('paiement')) {
      return NovaIntentType.BILLING;
    }
    if (lowerMessage.includes('bug') || lowerMessage.includes('erreur') || lowerMessage.includes('ne fonctionne pas')) {
      return NovaIntentType.TECHNICAL;
    }
    if (lowerMessage.includes('ticket') || lowerMessage.includes('support humain')) {
      return NovaIntentType.TICKET;
    }
    if (lowerMessage.includes('comment') || lowerMessage.includes('tutoriel') || lowerMessage.includes('guide')) {
      return NovaIntentType.TUTORIAL;
    }

    return NovaIntentType.FAQ;
  }

  private shouldEscalate(intent: NovaIntentType, response: string): boolean {
    if (intent === NovaIntentType.TICKET || intent === NovaIntentType.ESCALATE) {
      return true;
    }

    const lowerResponse = response.toLowerCase();
    const escalationKeywords = ['escalade', 'support humain', 'contacter', 'ticket'];

    return escalationKeywords.some(keyword => lowerResponse.includes(keyword));
  }
}
