import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface CreateTicketDto {
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  brandId?: string;
  userId?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface TicketSummary {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  messageCount: number;
}

@Injectable()
export class NovaTicketsService {
  private readonly logger = new Logger(NovaTicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTicket(dto: CreateTicketDto): Promise<TicketSummary> {
    const ticket = await this.prisma.novaTicket.create({
      data: {
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        category: dto.category || 'GENERAL',
        brandId: dto.brandId,
        userId: dto.userId,
        conversationId: dto.conversationId,
        metadata: (dto.metadata || {}) as any,
      },
    });

    // Create initial message
    await this.prisma.novaTicketMessage.create({
      data: {
        ticketId: ticket.id,
        role: 'customer',
        content: dto.description,
      },
    });

    // Log activity
    await this.prisma.novaTicketActivity.create({
      data: {
        ticketId: ticket.id,
        type: 'created',
        data: { source: 'nova_agent', conversationId: dto.conversationId } as any,
      },
    });

    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      messageCount: 1,
    };
  }

  async addMessage(
    ticketId: string,
    role: string,
    content: string,
    isInternal = false,
  ): Promise<void> {
    await this.prisma.novaTicketMessage.create({
      data: { ticketId, role, content, isInternal },
    });
  }

  async updateStatus(
    ticketId: string,
    status: string,
    actorId?: string,
  ): Promise<void> {
    const ticket = await this.prisma.novaTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return;

    await this.prisma.novaTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    await this.prisma.novaTicketActivity.create({
      data: {
        ticketId,
        type: 'status_change',
        data: { from: ticket.status, to: status } as any,
        actorId,
      },
    });
  }

  async getTicketsByUser(userId: string, limit = 10): Promise<TicketSummary[]> {
    const tickets = await this.prisma.novaTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { _count: { select: { messages: true } } },
    });

    return tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.createdAt,
      messageCount: t._count.messages,
    }));
  }

  async getTicketDetails(ticketId: string) {
    return this.prisma.novaTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }
}
