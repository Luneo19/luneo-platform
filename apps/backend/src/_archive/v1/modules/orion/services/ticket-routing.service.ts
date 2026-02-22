// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketPriority, UserRole } from '@/common/compat/v1-enums';

interface RoutingDecision {
  assignedTo: string | null;
  priority: TicketPriority;
  escalationLevel: string;
  reason: string;
}

@Injectable()
export class TicketRoutingService {
  private readonly logger = new Logger(TicketRoutingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async routeTicket(
    ticketId: string,
    analysis: {
      category: string;
      priority: string;
      sentiment?: string;
      confidenceScore?: number;
    },
  ): Promise<RoutingDecision> {
    const priority = this.mapPriority(analysis.priority, analysis.sentiment);
    const escalationLevel = this.determineEscalationLevel(
      priority,
      analysis.confidenceScore,
    );

    let assignedTo: string | null = null;

    if (escalationLevel !== 'L1_AI') {
      assignedTo = await this.findBestAgent(analysis.category);
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        priority,
        ...(assignedTo ? { assignedTo, assignedAt: new Date() } : {}),
        assignedAgent: escalationLevel,
      },
    });

    this.logger.log(
      `Routed ticket ${ticketId}: priority=${priority}, level=${escalationLevel}`,
    );

    return {
      assignedTo,
      priority,
      escalationLevel,
      reason: `Category: ${analysis.category}, Sentiment: ${analysis.sentiment || 'unknown'}`,
    };
  }

  private mapPriority(
    suggestedPriority: string,
    sentiment?: string,
  ): TicketPriority {
    const priorityMap: Record<string, TicketPriority> = {
      critical: TicketPriority.URGENT,
      urgent: TicketPriority.URGENT,
      high: TicketPriority.HIGH,
      medium: TicketPriority.MEDIUM,
      low: TicketPriority.LOW,
    };

    let priority =
      priorityMap[suggestedPriority.toLowerCase()] || TicketPriority.MEDIUM;

    if (
      sentiment === 'VERY_NEGATIVE' &&
      priority !== TicketPriority.URGENT
    ) {
      const levels = [
        TicketPriority.LOW,
        TicketPriority.MEDIUM,
        TicketPriority.HIGH,
        TicketPriority.URGENT,
      ];
      const currentIdx = levels.indexOf(priority);
      if (currentIdx < levels.length - 1) {
        priority = levels[currentIdx + 1];
      }
    }

    return priority;
  }

  private determineEscalationLevel(
    priority: TicketPriority,
    confidenceScore?: number,
  ): string {
    if (priority === TicketPriority.URGENT) {
      return 'L2_SUPPORT';
    }

    if (confidenceScore !== undefined && confidenceScore < 40) {
      return 'L2_SUPPORT';
    }

    return 'L1_AI';
  }

  private async findBestAgent(_category: string): Promise<string | null> {
    const agents = await this.prisma.user.findMany({
      where: {
        role: { in: ['SUPPORT_AGENT', 'PLATFORM_ADMIN'] as UserRole[] },
        isActive: true,
      },
      select: {
        id: true,
        _count: {
          select: {
            assignedTickets: {
              where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            },
          },
        },
      },
      orderBy: {
        assignedTickets: { _count: 'asc' },
      },
      take: 1,
    });

    return agents[0]?.id || null;
  }
}
