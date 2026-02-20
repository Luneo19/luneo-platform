import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface TicketContext {
  ticket: {
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    tags: string[];
    language: string;
    createdAt: Date;
  };
  messages: Array<{
    type: string;
    content: string;
    createdAt: Date;
    isInternal: boolean;
  }>;
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    totalTickets: number;
    healthScore: number | null;
    churnRisk: string | null;
  };
  brand: {
    id: string;
    name: string;
    plan: string;
  } | null;
  previousTickets: Array<{
    id: string;
    subject: string;
    status: string;
    category: string;
    resolvedAt: Date | null;
  }>;
}

@Injectable()
export class TicketContextService {
  private readonly logger = new Logger(TicketContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  async gatherContext(ticketId: string): Promise<TicketContext> {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
          select: {
            type: true,
            content: true,
            createdAt: true,
            isInternal: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            brandId: true,
            healthScore: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
          },
        },
      },
    });

    const [totalTickets, previousTickets] = await Promise.all([
      this.prisma.ticket.count({
        where: { userId: ticket.userId },
      }),
      this.prisma.ticket.findMany({
        where: {
          userId: ticket.userId,
          id: { not: ticketId },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          category: true,
          resolvedAt: true,
        },
      }),
    ]);

    return {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        tags: ticket.tags,
        language: ticket.language,
        createdAt: ticket.createdAt,
      },
      messages: ticket.messages,
      customer: {
        id: ticket.user.id,
        email: ticket.user.email,
        firstName: ticket.user.firstName,
        lastName: ticket.user.lastName,
        createdAt: ticket.user.createdAt,
        totalTickets,
        healthScore: ticket.user.healthScore?.healthScore ?? null,
        churnRisk: ticket.user.healthScore?.churnRisk ?? null,
      },
      brand: ticket.brand
        ? {
            id: ticket.brand.id,
            name: ticket.brand.name,
            plan: ticket.brand.subscriptionPlan,
          }
        : null,
      previousTickets,
    };
  }

  formatContextForLLM(context: TicketContext): string {
    const lines: string[] = [];

    lines.push(`## Ticket ${context.ticket.ticketNumber}`);
    lines.push(`Sujet: ${context.ticket.subject}`);
    lines.push(`Catégorie: ${context.ticket.category} | Priorité: ${context.ticket.priority}`);
    lines.push(`Description: ${context.ticket.description}`);
    lines.push('');

    if (context.messages.length > 0) {
      lines.push('## Historique des messages');
      for (const msg of context.messages) {
        if (!msg.isInternal) {
          lines.push(
            `[${msg.type}] ${msg.content.substring(0, 500)}`,
          );
        }
      }
      lines.push('');
    }

    lines.push('## Client');
    lines.push(
      `Nom: ${context.customer.firstName || ''} ${context.customer.lastName || ''}`.trim(),
    );
    lines.push(
      `Inscrit depuis: ${context.customer.createdAt.toISOString().split('T')[0]}`,
    );
    lines.push(`Tickets précédents: ${context.customer.totalTickets - 1}`);

    if (context.customer.healthScore !== null) {
      lines.push(`Health Score: ${context.customer.healthScore}/100`);
    }
    if (context.customer.churnRisk) {
      lines.push(`Risque churn: ${context.customer.churnRisk}`);
    }

    if (context.brand) {
      lines.push('');
      lines.push(`## Marque: ${context.brand.name} (${context.brand.plan})`);
    }

    if (context.previousTickets.length > 0) {
      lines.push('');
      lines.push('## Tickets précédents');
      for (const pt of context.previousTickets) {
        lines.push(`- ${pt.subject} [${pt.status}] (${pt.category})`);
      }
    }

    return lines.join('\n');
  }
}
