// @ts-nocheck
/**
 * Module 20 - Support Client.
 * Create tickets, knowledge base search, chatbot responses.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketCategory, TicketPriority } from '@prisma/client';

export interface CreateTicketInput {
  userId: string;
  category: TicketCategory | string;
  subject: string;
  message: string;
}

export interface KnowledgeBaseArticleResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
}

export interface ChatbotResponse {
  sessionId: string;
  message: string;
  response: string;
  suggestedArticles: Array<{ id: string; title: string; slug: string }>;
}

@Injectable()
export class SupportPortalService {
  private readonly logger = new Logger(SupportPortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a support ticket.
   */
  async createTicket(input: CreateTicketInput): Promise<{ ticketId: string; ticketNumber: string }> {
    const { userId, category, subject, message } = input;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User not found: ${userId}`);
    if (!subject?.trim()) throw new BadRequestException('Subject is required');
    if (!message?.trim()) throw new BadRequestException('Message is required');

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject: subject.trim(),
        description: message.trim(),
        category: (category as TicketCategory) ?? TicketCategory.TECHNICAL,
        priority: TicketPriority.MEDIUM,
        userId,
      },
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: message.trim(),
        userId,
      },
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} created for user ${userId}`);
    return { ticketId: ticket.id, ticketNumber: ticket.ticketNumber };
  }

  /**
   * Search knowledge base articles (optional query and category).
   */
  async getKnowledgeBase(query?: string, category?: string): Promise<KnowledgeBaseArticleResult[]> {
    const where: { isPublished: boolean; category?: string; OR?: object[] } = {
      isPublished: true,
    };
    if (category) where.category = category;
    if (query?.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
      ];
    }

    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        tags: true,
        helpful: true,
        notHelpful: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { helpful: 'desc' }, { views: 'desc' }],
      take: 50,
    });

    return articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      category: a.category,
      tags: a.tags,
      helpful: a.helpful,
      notHelpful: a.notHelpful,
    }));
  }

  /**
   * Get chatbot response for common questions (session-based).
   */
  async getChatbotResponse(sessionId: string, message: string): Promise<ChatbotResponse> {
    if (!message?.trim()) {
      throw new BadRequestException('Message is required');
    }

    const lower = message.toLowerCase().trim();
    let response = '';
    const suggestedArticles: Array<{ id: string; title: string; slug: string }> = [];

    if (/\b(price|tarif|pricing|plan|abonnement)\b/i.test(lower)) {
      response = 'Vous pouvez consulter nos tarifs et plans sur la page Pricing. Souhaitez-vous un lien vers un article détaillé ?';
      const articles = await this.prisma.knowledgeBaseArticle.findMany({
        where: { isPublished: true, OR: [{ category: 'billing' }, { tags: { has: 'pricing' } }] },
        select: { id: true, title: true, slug: true },
        take: 3,
      });
      suggestedArticles.push(...articles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })));
    } else if (/\b(design|création|personnalisation)\b/i.test(lower)) {
      response = 'Pour créer ou modifier un design, utilisez l’éditeur dans votre espace. Consultez notre guide ci-dessous.';
      const articles = await this.prisma.knowledgeBaseArticle.findMany({
        where: { isPublished: true, OR: [{ category: 'design' }, { tags: { has: 'editor' } }] },
        select: { id: true, title: true, slug: true },
        take: 3,
      });
      suggestedArticles.push(...articles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })));
    } else {
      response = 'Je n’ai pas trouvé de réponse précise. Voici des articles qui pourraient vous aider.';
      const articles = await this.prisma.knowledgeBaseArticle.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true },
        orderBy: { helpful: 'desc' },
        take: 5,
      });
      suggestedArticles.push(...articles.map((a) => ({ id: a.id, title: a.title, slug: a.slug })));
    }

    return {
      sessionId,
      message,
      response,
      suggestedArticles,
    };
  }
}
