import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChurnRisk, OrionAgentStatus, OrionAgentType, Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class OrionService {
  private readonly logger = new Logger(OrionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [agents, totalCustomers, activeCustomers, atRiskCustomers] = await Promise.all([
      this.prisma.orionAgent.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.customerHealthScore.count({ where: { churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] } } }),
    ]);

    return {
      agents,
      metrics: {
        totalCustomers,
        activeCustomers,
        atRiskCustomers,
        agentsActive: agents.filter((a) => a.status === OrionAgentStatus.ACTIVE).length,
        agentsTotal: agents.length,
      },
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
      { name: 'APOLLO', displayName: 'Apollo - Acquisition Intelligence', type: OrionAgentType.ACQUISITION, description: 'Lead scoring, campagnes intelligentes, A/B testing, attribution multi-touch' },
      { name: 'ATHENA', displayName: 'Athena - Onboarding Orchestrator', type: OrionAgentType.ONBOARDING, description: 'Parcours adaptatif, email sequences, health score, intervention proactive' },
      { name: 'HERMES', displayName: 'Hermes - Communication Hub', type: OrionAgentType.COMMUNICATION, description: 'Email automation, in-app messaging, SMS/WhatsApp, push notifications' },
      { name: 'ARTEMIS', displayName: 'Artemis - Retention Guardian', type: OrionAgentType.RETENTION, description: 'Churn prediction, health scoring, win-back campaigns, NPS automation' },
      { name: 'HADES', displayName: 'Hades - Revenue Optimizer', type: OrionAgentType.REVENUE, description: 'Upsell intelligence, cross-sell engine, pricing optimization' },
      { name: 'ZEUS', displayName: 'Zeus - Analytics Mastermind', type: OrionAgentType.ANALYTICS, description: 'Predictive analytics, cohort analysis, revenue attribution, anomaly detection' },
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

    this.logger.log('ORION agents seeded successfully');
  }

  async getHealthScores(options?: { churnRisk?: string; limit?: number }) {
    return this.prisma.customerHealthScore.findMany({
      where: options?.churnRisk ? { churnRisk: options.churnRisk as ChurnRisk } : undefined,
      take: options?.limit || 50,
      orderBy: { healthScore: 'asc' },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }
}
