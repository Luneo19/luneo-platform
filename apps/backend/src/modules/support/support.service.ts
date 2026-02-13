import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(userId: string, options?: { status?: string; category?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = { userId };

    if (options?.status) {
      where.status = options.status as TicketStatus;
    }

    if (options?.category) {
      where.category = options.category as unknown as TicketCategory;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * PERF-02: Pagination ajoutée sur messages et activities
   * Les tickets avec beaucoup de messages ne chargent plus tout d'un coup
   */
  async getTicket(
    id: string, 
    userId: string,
    options?: { 
      messagesPage?: number; 
      messagesLimit?: number;
      activitiesPage?: number;
      activitiesLimit?: number;
    }
  ) {
    const messagesPage = options?.messagesPage || 1;
    const messagesLimit = Math.min(options?.messagesLimit || 50, 100);
    const messagesSkip = (messagesPage - 1) * messagesLimit;
    
    const activitiesPage = options?.activitiesPage || 1;
    const activitiesLimit = Math.min(options?.activitiesLimit || 20, 50);
    const activitiesSkip = (activitiesPage - 1) * activitiesLimit;

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
          skip: messagesSkip,
          take: messagesLimit,
        },
        attachments: true,
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: activitiesSkip,
          take: activitiesLimit,
        },
        _count: {
          select: {
            messages: true,
            activities: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    // PERF-02: Retourner les infos de pagination
    return {
      ...ticket,
      pagination: {
        messages: {
          page: messagesPage,
          limit: messagesLimit,
          total: ticket._count.messages,
          totalPages: Math.ceil(ticket._count.messages / messagesLimit),
          hasNext: messagesPage * messagesLimit < ticket._count.messages,
          hasPrev: messagesPage > 1,
        },
        activities: {
          page: activitiesPage,
          limit: activitiesLimit,
          total: ticket._count.activities,
          totalPages: Math.ceil(ticket._count.activities / activitiesLimit),
          hasNext: activitiesPage * activitiesLimit < ticket._count.activities,
          hasPrev: activitiesPage > 1,
        },
      },
    };
  }

  async createTicket(data: {
    userId: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }) {
    // Generate ticket number
    const ticketCount = await this.prisma.ticket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, '0')}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        category: (data.category as TicketCategory) || TicketCategory.TECHNICAL,
        priority: (data.priority as TicketPriority) || TicketPriority.MEDIUM,
        userId: data.userId,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create initial message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: data.description,
        userId: data.userId,
        type: 'USER',
      },
    });

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        action: 'created',
        userId: data.userId,
      },
    });

    return ticket;
  }

  async updateTicket(id: string, data: { status?: string; priority?: string; category?: string }, userId: string) {
    const ticket = await this.getTicket(id, userId);

    const updateData: Prisma.TicketUpdateInput = {};
    if (data.status) updateData.status = data.status as TicketStatus;
    if (data.priority) updateData.priority = data.priority as TicketPriority;
    if (data.category) updateData.category = data.category as unknown as TicketCategory;

    if (data.status === 'RESOLVED' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (data.status === 'CLOSED' && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create activity
    if (data.status) {
      await this.prisma.ticketActivity.create({
        data: {
          ticketId: id,
          action: 'status_changed',
          userId,
          oldValue: ticket.status,
          newValue: data.status,
        },
      });
    }

    return updatedTicket;
  }

  async addMessageToTicket(ticketId: string, userId: string, content: string) {
    // Vérifier que le ticket existe et appartient à l'utilisateur
    const ticket = await this.getTicket(ticketId, userId);

    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      throw new ForbiddenException('Cannot add messages to a closed or resolved ticket');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        content,
        type: 'USER',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        action: 'message_added',
        userId,
      },
    });

    return message;
  }

  async getKnowledgeBaseArticles(options?: { category?: string; search?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.KnowledgeBaseArticleWhereInput = { isPublished: true };

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
        { tags: { has: options.search.toLowerCase() } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          tags: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getKnowledgeBaseArticle(slug: string) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!article.isPublished) {
      throw new ForbiddenException('Access denied to unpublished article');
    }

    // Increment views
    await this.prisma.knowledgeBaseArticle.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  /**
   * Submit CSAT (Customer Satisfaction) rating for a resolved/closed ticket
   */
  async submitCSAT(ticketId: string, userId: string, data: { rating: number; comment?: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      throw new ForbiddenException('CSAT can only be submitted for resolved or closed tickets');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new ForbiddenException('Rating must be between 1 and 5');
    }

    // Update ticket with CSAT data
    const metadata = {
      ...(ticket.metadata as Record<string, unknown> || {}),
      csat: {
        rating: data.rating,
        comment: data.comment || null,
        submittedAt: new Date().toISOString(),
      },
    };

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        action: 'csat_submitted',
        userId,
        newValue: `Rating: ${data.rating}/5`,
      },
    });

    return { success: true, rating: data.rating };
  }
}
