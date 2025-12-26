import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  MessageType,
  UserRole,
} from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

/**
 * Tickets Service - Enterprise Grade
 * Handles all ticket operations with full audit trail
 * Inspired by: Zendesk, Intercom, Linear Issues, GitHub Issues
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate unique ticket number
   * Format: TKT-XXXXX (e.g., TKT-12345)
   */
  private generateTicketNumber(): string {
    const random = Math.floor(Math.random() * 100000);
    return `TKT-${random.toString().padStart(5, '0')}`;
  }

  /**
   * Create a new support ticket
   */
  @CacheInvalidate({
    type: 'ticket',
    tags: () => ['tickets:list'],
  })
  async createTicket(dto: CreateTicketDto, user: CurrentUser) {
    const ticketNumber = this.generateTicketNumber();

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        status: TicketStatus.OPEN,
        priority: dto.priority || TicketPriority.MEDIUM,
        category: dto.category || TicketCategory.TECHNICAL,
        userId: user.id,
        tags: dto.tags || [],
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            messages: true,
            attachments: true,
          },
        },
      },
    });

    // Create activity log
    await this.createActivity(ticket.id, user.id, 'created', null, null);

    this.logger.log('Ticket created', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: user.id,
    });

    return ticket;
  }

  /**
   * Get tickets with filters and pagination
   */
  @Cacheable({
    type: 'ticket',
    ttl: 30,
    keyGenerator: (args) => `tickets:list:${JSON.stringify(args[0])}`,
  })
  async getTickets(
    filters: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
      userId?: string;
      assignedTo?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
    user: CurrentUser
  ) {
    const {
      status,
      priority,
      category,
      userId,
      assignedTo,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};

    // Permission check: users can only see their own tickets unless admin
    if (user.role !== UserRole.PLATFORM_ADMIN && user.role !== UserRole.BRAND_ADMIN) {
      where.userId = user.id;
    } else {
      if (userId) where.userId = userId;
      if (assignedTo) where.assignedTo = assignedTo;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
          assignedToUser: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a single ticket by ID
   */
  @Cacheable({
    type: 'ticket',
    ttl: 60,
    keyGenerator: (args) => `ticket:${args[0]}`,
  })
  async getTicket(ticketId: string, user: CurrentUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        activities: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
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

    // Permission check
    if (
      user.role !== UserRole.PLATFORM_ADMIN &&
      user.role !== UserRole.BRAND_ADMIN &&
      ticket.userId !== user.id
    ) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    return ticket;
  }

  /**
   * Update a ticket
   */
  @CacheInvalidate({
    type: 'ticket',
    pattern: (args) => `ticket:${args[0]}`,
    tags: () => ['tickets:list'],
  })
  async updateTicket(
    ticketId: string,
    dto: UpdateTicketDto,
    user: CurrentUser
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Permission check
    if (
      user.role !== UserRole.PLATFORM_ADMIN &&
      user.role !== UserRole.BRAND_ADMIN &&
      ticket.userId !== user.id
    ) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    const updates: any = {};
    const activities: Array<{
      action: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    if (dto.status && dto.status !== ticket.status) {
      activities.push({
        action: 'status_changed',
        oldValue: ticket.status,
        newValue: dto.status,
      });
      updates.status = dto.status;

      if (dto.status === TicketStatus.RESOLVED) {
        updates.resolvedAt = new Date();
      } else if (dto.status === TicketStatus.CLOSED) {
        updates.closedAt = new Date();
      }
    }

    if (dto.priority && dto.priority !== ticket.priority) {
      activities.push({
        action: 'priority_changed',
        oldValue: ticket.priority,
        newValue: dto.priority,
      });
      updates.priority = dto.priority;
    }

    if (dto.category && dto.category !== ticket.category) {
      activities.push({
        action: 'category_changed',
        oldValue: ticket.category,
        newValue: dto.category,
      });
      updates.category = dto.category;
    }

    if (dto.assignedTo && dto.assignedTo !== ticket.assignedTo) {
      activities.push({
        action: 'assigned',
        oldValue: ticket.assignedTo,
        newValue: dto.assignedTo,
      });
      updates.assignedTo = dto.assignedTo;
      updates.assignedAt = new Date();
    }

    if (dto.subject) updates.subject = dto.subject;
    if (dto.description) updates.description = dto.description;
    if (dto.tags) updates.tags = dto.tags;

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        assignedToUser: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            messages: true,
            attachments: true,
          },
        },
      },
    });

    // Create activity logs
    for (const activity of activities) {
      await this.createActivity(
        ticketId,
        user.id,
        activity.action,
        activity.oldValue,
        activity.newValue
      );
    }

    this.logger.log('Ticket updated', {
      ticketId: ticket.id,
      userId: user.id,
      updates: Object.keys(updates),
    });

    return updatedTicket;
  }

  /**
   * Add a message to a ticket
   */
  @CacheInvalidate({
    type: 'ticket',
    pattern: (args) => `ticket:${args[0]}`,
    tags: () => ['tickets:list'],
  })
  async addMessage(
    ticketId: string,
    dto: CreateMessageDto,
    user: CurrentUser
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Permission check
    if (
      user.role !== UserRole.PLATFORM_ADMIN &&
      user.role !== UserRole.BRAND_ADMIN &&
      ticket.userId !== user.id
    ) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        content: dto.content,
        type: dto.type || MessageType.USER,
        userId: user.id,
        isInternal: dto.isInternal || false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        attachments: true,
      },
    });

    // Update ticket status if first response
    if (!ticket.firstResponseAt && dto.type === MessageType.AGENT) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
    }

    // Update ticket status to IN_PROGRESS if it was OPEN
    if (ticket.status === TicketStatus.OPEN) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    // Create activity log
    await this.createActivity(ticketId, user.id, 'message_added', null, null);

    this.logger.log('Message added to ticket', {
      ticketId: ticket.id,
      messageId: message.id,
      userId: user.id,
    });

    return message;
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(user: CurrentUser) {
    const where: any = {};

    // Permission check
    if (user.role !== UserRole.PLATFORM_ADMIN && user.role !== UserRole.BRAND_ADMIN) {
      where.userId = user.id;
    }

    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      byPriority,
      byCategory,
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({
        where: { ...where, status: TicketStatus.IN_PROGRESS },
      }),
      this.prisma.ticket.count({
        where: { ...where, status: TicketStatus.RESOLVED },
      }),
      this.prisma.ticket.count({
        where: { ...where, status: TicketStatus.CLOSED },
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: {
        open,
        inProgress,
        resolved,
        closed,
      },
      byPriority: byPriority.reduce(
        (acc, item) => {
          acc[item.priority] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byCategory: byCategory.reduce(
        (acc, item) => {
          acc[item.category] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  /**
   * Create activity log entry
   */
  private async createActivity(
    ticketId: string,
    userId: string,
    action: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        userId,
        action,
        oldValue,
        newValue,
      },
    });
  }
}

