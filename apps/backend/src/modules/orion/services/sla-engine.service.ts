// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketStatus } from '@prisma/client';

interface SLAConfig {
  firstResponseMin: number;
  resolutionMin: number;
}

const DEFAULT_SLA_BY_PLAN: Record<string, Record<string, SLAConfig>> = {
  FREE: {
    LOW: { firstResponseMin: 2880, resolutionMin: 5760 },
    MEDIUM: { firstResponseMin: 2880, resolutionMin: 4320 },
    HIGH: { firstResponseMin: 1440, resolutionMin: 2880 },
    URGENT: { firstResponseMin: 720, resolutionMin: 1440 },
    CRITICAL: { firstResponseMin: 480, resolutionMin: 1440 },
  },
  STARTER: {
    LOW: { firstResponseMin: 1440, resolutionMin: 4320 },
    MEDIUM: { firstResponseMin: 1440, resolutionMin: 2880 },
    HIGH: { firstResponseMin: 480, resolutionMin: 1440 },
    URGENT: { firstResponseMin: 240, resolutionMin: 720 },
    CRITICAL: { firstResponseMin: 120, resolutionMin: 480 },
  },
  PROFESSIONAL: {
    LOW: { firstResponseMin: 480, resolutionMin: 2880 },
    MEDIUM: { firstResponseMin: 480, resolutionMin: 1440 },
    HIGH: { firstResponseMin: 240, resolutionMin: 720 },
    URGENT: { firstResponseMin: 120, resolutionMin: 480 },
    CRITICAL: { firstResponseMin: 60, resolutionMin: 240 },
  },
  BUSINESS: {
    LOW: { firstResponseMin: 240, resolutionMin: 1440 },
    MEDIUM: { firstResponseMin: 240, resolutionMin: 720 },
    HIGH: { firstResponseMin: 120, resolutionMin: 480 },
    URGENT: { firstResponseMin: 60, resolutionMin: 240 },
    CRITICAL: { firstResponseMin: 30, resolutionMin: 120 },
  },
  ENTERPRISE: {
    LOW: { firstResponseMin: 120, resolutionMin: 720 },
    MEDIUM: { firstResponseMin: 60, resolutionMin: 480 },
    HIGH: { firstResponseMin: 60, resolutionMin: 240 },
    URGENT: { firstResponseMin: 30, resolutionMin: 120 },
    CRITICAL: { firstResponseMin: 15, resolutionMin: 60 },
  },
};

@Injectable()
export class SLAEngineService {
  private readonly logger = new Logger(SLAEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateSLADeadline(
    ticketId: string,
    brandPlan?: string,
    priority?: string,
  ): Promise<Date> {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { brand: { select: { subscriptionPlan: true } } },
    });

    const plan = brandPlan || ticket.brand?.subscriptionPlan || 'FREE';
    const prio = priority || ticket.priority;

    const customPolicy = await this.prisma.supportSLAPolicy.findFirst({
      where: {
        plan: plan.toUpperCase(),
        priority: prio,
        isActive: true,
      },
    });

    const config = customPolicy
      ? {
          firstResponseMin: customPolicy.firstResponseMin,
          resolutionMin: customPolicy.resolutionMin,
        }
      : this.getDefaultSLA(plan, prio);

    const deadline = new Date(
      ticket.createdAt.getTime() + config.resolutionMin * 60 * 1000,
    );

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { slaDeadline: deadline },
    });

    return deadline;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkSLABreaches() {
    const now = new Date();

    const nearBreachTickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
        slaDeadline: { not: null },
        slaBreach: false,
      },
      select: {
        id: true,
        ticketNumber: true,
        slaDeadline: true,
        priority: true,
        brandId: true,
      },
    });

    let breached = 0;
    let nearBreach = 0;

    for (const ticket of nearBreachTickets) {
      if (!ticket.slaDeadline) continue;

      if (ticket.slaDeadline <= now) {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { slaBreach: true },
        });
        breached++;
        this.logger.warn(
          `SLA BREACH: Ticket ${ticket.ticketNumber} has exceeded deadline`,
        );
      } else {
        const timeLeft =
          ticket.slaDeadline.getTime() - now.getTime();
        const warningThreshold = 15 * 60 * 1000;
        if (timeLeft <= warningThreshold) {
          nearBreach++;
          this.logger.warn(
            `SLA WARNING: Ticket ${ticket.ticketNumber} approaching breach (${Math.round(timeLeft / 60000)}min left)`,
          );
        }
      }
    }

    if (breached > 0 || nearBreach > 0) {
      this.logger.log(
        `SLA check: ${breached} breached, ${nearBreach} near breach`,
      );
    }
  }

  async getSLAStatus(ticketId: string) {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      select: {
        slaDeadline: true,
        slaBreach: true,
        createdAt: true,
        firstResponseAt: true,
        resolvedAt: true,
        priority: true,
      },
    });

    if (!ticket.slaDeadline) {
      return { status: 'no_sla', breached: false };
    }

    const now = new Date();
    const timeLeftMs = ticket.slaDeadline.getTime() - now.getTime();

    return {
      status: ticket.slaBreach
        ? 'breached'
        : timeLeftMs <= 0
          ? 'breached'
          : timeLeftMs <= 30 * 60 * 1000
            ? 'at_risk'
            : 'on_track',
      breached: ticket.slaBreach,
      deadline: ticket.slaDeadline,
      timeLeftMin: Math.max(0, Math.round(timeLeftMs / 60000)),
      firstResponseAt: ticket.firstResponseAt,
      resolvedAt: ticket.resolvedAt,
    };
  }

  private getDefaultSLA(plan: string, priority: string): SLAConfig {
    const planConfig = DEFAULT_SLA_BY_PLAN[plan.toUpperCase()];
    if (!planConfig) {
      return DEFAULT_SLA_BY_PLAN.FREE.MEDIUM;
    }
    return planConfig[priority] || planConfig.MEDIUM;
  }
}
