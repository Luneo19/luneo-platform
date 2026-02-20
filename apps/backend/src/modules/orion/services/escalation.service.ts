import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EscalationLevel, Prisma } from '@prisma/client';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async escalateTicket(
    ticketId: string,
    toLevel: EscalationLevel,
    reason: string,
    escalatedById?: string,
  ) {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      select: { id: true, assignedAgent: true },
    });

    const fromLevel = (ticket.assignedAgent as EscalationLevel) || EscalationLevel.L1_AI;

    const history = await this.prisma.escalationHistory.create({
      data: {
        ticketId,
        fromLevel,
        toLevel,
        reason,
        escalatedById,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedAgent: toLevel },
    });

    this.logger.log(
      `Ticket ${ticketId} escalated from ${fromLevel} to ${toLevel}: ${reason}`,
    );

    return history;
  }

  async getEscalationHistory(ticketId: string) {
    return this.prisma.escalationHistory.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: {
        escalatedBy: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async getRules(brandId?: string) {
    return this.prisma.escalationRule.findMany({
      where: {
        isActive: true,
        ...(brandId ? { brandId } : {}),
      },
      orderBy: { fromLevel: 'asc' },
    });
  }

  async createRule(data: {
    brandId?: string;
    name: string;
    fromLevel: EscalationLevel;
    toLevel: EscalationLevel;
    conditions: Record<string, unknown>;
    timeoutMin?: number;
  }) {
    return this.prisma.escalationRule.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        fromLevel: data.fromLevel,
        toLevel: data.toLevel,
        conditions: data.conditions as unknown as Prisma.InputJsonValue,
        timeoutMin: data.timeoutMin || 60,
      },
    });
  }

  async updateRule(
    ruleId: string,
    data: Partial<{
      name: string;
      conditions: Record<string, unknown>;
      timeoutMin: number;
      isActive: boolean;
    }>,
  ) {
    return this.prisma.escalationRule.update({
      where: { id: ruleId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.conditions !== undefined
          ? { conditions: data.conditions as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.timeoutMin !== undefined
          ? { timeoutMin: data.timeoutMin }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async checkAutoEscalation() {
    const rules = await this.prisma.escalationRule.findMany({
      where: { isActive: true },
    });

    for (const rule of rules) {
      const conditions = rule.conditions as Record<string, unknown>;

      if (conditions.timeoutBased) {
        const staleTickets = await this.prisma.ticket.findMany({
          where: {
            assignedAgent: rule.fromLevel,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            updatedAt: {
              lte: new Date(Date.now() - rule.timeoutMin * 60 * 1000),
            },
          },
          select: { id: true },
        });

        for (const ticket of staleTickets) {
          await this.escalateTicket(
            ticket.id,
            rule.toLevel,
            `Auto-escalade: timeout ${rule.timeoutMin}min atteint (${rule.name})`,
          );
        }
      }
    }
  }
}
