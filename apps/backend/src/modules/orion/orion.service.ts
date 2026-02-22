// @ts-nocheck
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChurnRisk, OrionAgentStatus, OrionAgentType, Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Subject, Observable } from 'rxjs';

interface OrionEvent {
  type: string;
  agentType?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class OrionService {
  private readonly logger = new Logger(OrionService.name);
  private readonly eventStream$ = new Subject<OrionEvent>();

  constructor(private readonly prisma: PrismaService) {}

  getEventStream(): Observable<OrionEvent> {
    return this.eventStream$.asObservable();
  }

  emitEvent(event: Omit<OrionEvent, 'timestamp'>) {
    this.eventStream$.next({ ...event, timestamp: new Date() });
  }

  async getOverview() {
    const [
      agents,
      totalCustomers,
      activeCustomers,
      atRiskCustomers,
      openTickets,
      pendingReviews,
      criticalAlerts,
      recentInsights,
      recentActions,
    ] = await Promise.all([
      this.prisma.orionAgent.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.customerHealthScore.count({
        where: { churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] } },
      }),
      this.prisma.ticket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.aITicketResponse.count({ where: { status: 'PENDING' } }),
      this.prisma.orionAgentAction.count({
        where: { status: 'pending', priority: { in: ['critical', 'high'] } },
      }),
      this.prisma.orionInsight.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.orionAgentAction.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      agents,
      metrics: {
        totalCustomers,
        activeCustomers,
        atRiskCustomers,
        openTickets,
        pendingReviews,
        criticalAlerts,
        agentsActive: agents.filter((a) => a.status === OrionAgentStatus.ACTIVE).length,
        agentsTotal: agents.length,
      },
      recentInsights,
      recentActions,
    };
  }

  async getAgents() {
    return this.prisma.orionAgent.findMany({ orderBy: { name: 'asc' } });
  }

  async getAgent(id: string) {
    const agent = await this.prisma.orionAgent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async updateAgent(id: string, data: { status?: string; config?: Record<string, unknown> }) {
    const { status, config, ...rest } = data;
    return this.prisma.orionAgent.update({
      where: { id },
      data: {
        ...rest,
        ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
        ...(status ? { status: status as OrionAgentStatus } : {}),
      } as Prisma.OrionAgentUpdateInput,
    });
  }

  async seedAgents() {
    const agents = [
      { name: 'PROMETHEUS', displayName: 'Prometheus - Support IA', type: OrionAgentType.GENERAL, description: 'Analyse tickets, génération réponses IA, review queue' },
      { name: 'ZEUS', displayName: 'Zeus - Strategic Commander', type: OrionAgentType.ANALYTICS, description: 'Monitoring critique, alertes stratégiques, décisions override' },
      { name: 'ATHENA', displayName: 'Athena - Intelligence Analyst', type: OrionAgentType.ONBOARDING, description: 'Health scores, churn prediction, insights avancés' },
      { name: 'APOLLO', displayName: 'Apollo - Platform Guardian', type: OrionAgentType.ACQUISITION, description: 'Health monitoring services, SLA tracking, incidents' },
      { name: 'ARTEMIS', displayName: 'Artemis - Security Hunter', type: OrionAgentType.RETENTION, description: 'Brute force, API abuse, fraud detection, IP blocking' },
      { name: 'HERMES', displayName: 'Hermes - Communication Master', type: OrionAgentType.COMMUNICATION, description: 'Re-engagement, milestones, trial check, notifications' },
      { name: 'HADES', displayName: 'Hades - Retention Keeper', type: OrionAgentType.REVENUE, description: 'Churn prediction, win-back campaigns, MRR at risk' },
    ];

    await this.prisma.$transaction(
      agents.map((agent) =>
        this.prisma.orionAgent.upsert({
          where: { name: agent.name },
          update: { displayName: agent.displayName, type: agent.type, description: agent.description },
          create: { ...agent, status: OrionAgentStatus.PAUSED },
        }),
      ),
    );

    this.logger.log('ORION agents seeded successfully (7 agents)');
  }

  async getHealthScores(options?: { churnRisk?: string; limit?: number }) {
    return this.prisma.customerHealthScore.findMany({
      where: options?.churnRisk ? { churnRisk: options.churnRisk as ChurnRisk } : undefined,
      take: options?.limit || 50,
      orderBy: { healthScore: 'asc' },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }

  async getInsights(filters?: { agentType?: string; isRead?: boolean; limit?: number }) {
    return this.prisma.orionInsight.findMany({
      where: {
        ...(filters?.agentType ? { agentType: filters.agentType } : {}),
        ...(filters?.isRead !== undefined ? { isRead: filters.isRead } : {}),
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
    });
  }

  async markInsightRead(id: string) {
    return this.prisma.orionInsight.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async archiveInsight(id: string) {
    return this.prisma.orionInsight.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async getActions(filters?: { agentType?: string; status?: string; limit?: number }) {
    return this.prisma.orionAgentAction.findMany({
      where: {
        ...(filters?.agentType ? { agentType: filters.agentType } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
    });
  }

  async executeAction(actionId: string) {
    return this.prisma.orionAgentAction.update({
      where: { id: actionId },
      data: { status: 'executed', executedAt: new Date() },
    });
  }

  async dismissAction(actionId: string) {
    return this.prisma.orionAgentAction.update({
      where: { id: actionId },
      data: { status: 'dismissed' },
    });
  }

  async getActivityFeed(limit = 30) {
    const [actions, insights, reviews] = await Promise.all([
      this.prisma.orionAgentAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          agentType: true,
          actionType: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.orionInsight.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          agentType: true,
          type: true,
          title: true,
          severity: true,
          createdAt: true,
        },
      }),
      this.prisma.aITicketResponse.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          status: true,
          confidenceScore: true,
          modelUsed: true,
          createdAt: true,
        },
      }),
    ]);

    const feed = [
      ...actions.map((a) => ({
        type: 'action' as const,
        id: a.id,
        agent: a.agentType,
        title: a.title,
        status: a.status,
        createdAt: a.createdAt,
      })),
      ...insights.map((i) => ({
        type: 'insight' as const,
        id: i.id,
        agent: i.agentType,
        title: i.title,
        status: i.severity,
        createdAt: i.createdAt,
      })),
      ...reviews.map((r) => ({
        type: 'ai_response' as const,
        id: r.id,
        agent: 'prometheus',
        title: `AI Response (${r.confidenceScore}% confidence)`,
        status: r.status,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return feed.slice(0, limit);
  }
}
