import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketsService } from './services/tickets.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';

/**
 * Main Support Service
 * Orchestrates all support operations
 * Inspired by: Zendesk, Intercom, Linear Support
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
    private readonly knowledgeBaseService: KnowledgeBaseService
  ) {}

  /**
   * Get comprehensive support dashboard
   */
  async getDashboard(user: any) {
    const [stats, recentTickets, featuredArticles] = await Promise.all([
      this.ticketsService.getTicketStats(user),
      this.ticketsService.getTickets(
        { limit: 10, offset: 0 },
        user
      ),
      this.knowledgeBaseService.getArticles({
        featured: true,
        limit: 5,
      }),
    ]);

    return {
      stats,
      recentTickets: recentTickets.tickets,
      featuredArticles: featuredArticles.articles,
      timestamp: new Date().toISOString(),
    };
  }
}

