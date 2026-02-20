import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma, AgentAlertType, AlertSeverity, AgentAlertStatus, AgentMetricType } from '@prisma/client';

export interface CreateAgentAlertDto {
  type: 'BUDGET_EXCEEDED' | 'PROVIDER_DOWN' | 'HIGH_ERROR_RATE' | 'HIGH_LATENCY' | 'CIRCUIT_BREAKER_OPEN' | 'QUOTA_EXCEEDED' | 'SECURITY_THREAT';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  brandId?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class AgentAlertsService {
  private readonly logger = new Logger(AgentAlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAlert(dto: CreateAgentAlertDto): Promise<string> {
    // Prevent duplicate alerts within 5 minutes
    const recentAlert = await this.prisma.agentAlert.findFirst({
      where: {
        type: dto.type as AgentAlertType,
        brandId: dto.brandId,
        status: 'ACTIVE' as AgentAlertStatus,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    if (recentAlert) {
      return recentAlert.id;
    }

    const alert = await this.prisma.agentAlert.create({
      data: {
        type: dto.type as AgentAlertType,
        severity: dto.severity as AlertSeverity,
        status: 'ACTIVE' as AgentAlertStatus,
        title: dto.title,
        message: dto.message,
        brandId: dto.brandId,
        data: (dto.data || {}) as Prisma.InputJsonValue,
      },
    });

    this.logger.warn(`Alert created: [${dto.severity}] ${dto.title}`);
    return alert.id;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await this.prisma.agentAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED' as AgentAlertStatus,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
    });
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    await this.prisma.agentAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED' as AgentAlertStatus,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });
  }

  async getActiveAlerts(brandId?: string): Promise<unknown[]> {
    const where: Prisma.AgentAlertWhereInput = {
      status: { in: ['ACTIVE', 'ACKNOWLEDGED'] as AgentAlertStatus[] },
    };
    if (brandId) where.brandId = brandId;

    return this.prisma.agentAlert.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async recordMetric(data: {
    brandId?: string;
    agentType?: string;
    provider?: string;
    model?: string;
    metricType: string;
    value: number;
    unit?: string;
    tags?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.agentMetric.create({
        data: {
          brandId: data.brandId,
          agentType: data.agentType,
          provider: data.provider,
          model: data.model,
          metricType: data.metricType as AgentMetricType,
          value: data.value,
          unit: data.unit,
          tags: (data.tags || {}) as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Non-critical
    }
  }

  async getMetricsSummary(
    brandId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    },
  ): Promise<Record<string, { avg: number; min: number; max: number; count: number }>> {
    const where: Prisma.AgentMetricWhereInput = {
      timestamp: { gte: timeRange.start, lte: timeRange.end },
    };
    if (brandId) where.brandId = brandId;

    const metrics = await this.prisma.agentMetric.findMany({
      where,
      select: { metricType: true, value: true },
    });

    const grouped: Record<string, number[]> = {};
    for (const m of metrics) {
      const key = m.metricType;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m.value);
    }

    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [key, values] of Object.entries(grouped)) {
      const sorted = values.sort((a, b) => a - b);
      summary[key] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        count: values.length,
      };
    }

    return summary;
  }
}
