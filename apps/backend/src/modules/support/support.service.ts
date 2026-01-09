import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketCategory, TicketPriority } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getTickets(userId: string, options?: { status?: string; category?: string; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.category) {
      where.category = options.category;
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

  async getTicket(id: string, userId: string) {
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
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    return ticket;
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

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.category) updateData.category = data.category;

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

    const where: any = { isPublished: true };

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
}
