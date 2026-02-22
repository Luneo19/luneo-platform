// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ORION_DEFAULTS, ZEUS_THRESHOLDS, OrionAgentActionData } from '../../orion.constants';

interface CriticalAlert {
  type: string;
  severity: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export interface StrategicDecision {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
export class ZeusService {
  private readonly logger = new Logger(ZeusService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorCriticalMetrics() {
    this.logger.debug('Zeus: Running critical metrics monitoring');

    const [revenueAlerts, churnAlerts, slaAlerts, systemAlerts] =
      await Promise.all([
        this.checkRevenueAnomalies(),
        this.checkChurnSpike(),
        this.checkSLABreaches(),
        this.checkSystemHealth(),
      ]);

    const allAlerts = [
      ...revenueAlerts,
      ...churnAlerts,
      ...slaAlerts,
      ...systemAlerts,
    ];

    for (const alert of allAlerts) {
      await this.createAlert(alert);
    }

    if (allAlerts.length > 0) {
      this.logger.warn(
        `Zeus detected ${allAlerts.length} critical alerts`,
      );
    }
  }

  async getCriticalAlerts(limit: number = ORION_DEFAULTS.LIST_LIMIT) {
    return this.prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
        severity: { in: ['CRITICAL', 'WARNING'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getStrategicDecisions(limit: number = ORION_DEFAULTS.DASHBOARD_LIMIT): Promise<StrategicDecision[]> {
    const actions = await this.prisma.orionAgentAction.findMany({
      where: { agentType: 'zeus' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return actions.map((a) => ({
      id: a.id,
      type: a.actionType,
      title: a.title,
      description: a.description || '',
      impact: a.priority,
      suggestedAction: (a.data as OrionAgentActionData)?.suggestedAction || '',
      data: (a.data as Record<string, unknown>) || {},
      createdAt: a.createdAt,
    }));
  }

  async executeOverride(actionId: string, approved: boolean) {
    const action = await this.prisma.orionAgentAction.update({
      where: { id: actionId },
      data: {
        status: approved ? 'executed' : 'rejected',
        executedAt: approved ? new Date() : undefined,
      },
    });

    this.logger.log(
      `Zeus override: ${approved ? 'APPROVED' : 'REJECTED'} action ${actionId}`,
    );

    return action;
  }

  async getDashboard() {
    const [alerts, decisions, metrics] = await Promise.all([
      this.getCriticalAlerts(10),
      this.getStrategicDecisions(5),
      this.getKeyMetrics(),
    ]);

    return { alerts, decisions, metrics };
  }

  private async checkRevenueAnomalies(): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBrands = await this.prisma.brand.count({
      where: {
        subscriptionStatus: 'CANCELED',
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    if (recentBrands > ZEUS_THRESHOLDS.CANCELLATION_ALERT_THRESHOLD) {
      alerts.push({
        type: 'revenue_anomaly',
        severity: 'critical',
        title: 'Pic d\'annulations détecté',
        description: `${recentBrands} annulations dans les 30 derniers jours`,
        data: { canceledCount: recentBrands },
      });
    }

    return alerts;
  }

  private async checkChurnSpike(): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = [];

    const atRisk = await this.prisma.customerHealthScore.count({
      where: { churnRisk: { in: ['HIGH', 'CRITICAL'] } },
    });
    const total = await this.prisma.customerHealthScore.count();

    if (total > 0 && atRisk / total > ZEUS_THRESHOLDS.CHURN_PERCENTAGE_ALERT) {
      alerts.push({
        type: 'churn_spike',
        severity: 'warning',
        title: 'Risque de churn élevé',
        description: `${Math.round((atRisk / total) * 100)}% des clients à risque (${atRisk}/${total})`,
        data: { atRisk, total, percentage: atRisk / total },
      });
    }

    return alerts;
  }

  private async checkSLABreaches(): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = [];

    const breachedCount = await this.prisma.ticket.count({
      where: {
        slaBreach: true,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    if (breachedCount > ZEUS_THRESHOLDS.SLA_BREACH_ALERT_THRESHOLD) {
      alerts.push({
        type: 'sla_breach',
        severity: 'warning',
        title: 'Multiples violations SLA',
        description: `${breachedCount} tickets en violation SLA active`,
        data: { breachedCount },
      });
    }

    return alerts;
  }

  private async checkSystemHealth(): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = [];

    const unhealthyServices = await this.prisma.serviceHealth.count({
      where: { status: { not: 'HEALTHY' } },
    });

    if (unhealthyServices > 0) {
      alerts.push({
        type: 'system_health',
        severity: unhealthyServices > ZEUS_THRESHOLDS.UNHEALTHY_SERVICES_CRITICAL ? 'critical' : 'warning',
        title: 'Services dégradés',
        description: `${unhealthyServices} services en état non-healthy`,
        data: { unhealthyServices },
      });
    }

    return alerts;
  }

  private async createAlert(alert: CriticalAlert) {
    await this.prisma.orionAgentAction.create({
      data: {
        agentType: 'zeus',
        actionType: alert.type,
        title: alert.title,
        description: alert.description,
        priority: alert.severity,
        data: alert.data as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async getKeyMetrics() {
    const [totalBrands, activeBrands, totalTickets, openTickets] =
      await Promise.all([
        this.prisma.brand.count(),
        this.prisma.brand.count({
          where: { subscriptionStatus: 'ACTIVE' },
        }),
        this.prisma.ticket.count(),
        this.prisma.ticket.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        }),
      ]);

    return {
      totalBrands,
      activeBrands,
      totalTickets,
      openTickets,
    };
  }
}
