// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServiceHealthStatus, AlertSeverity, AlertStatus, Prisma } from '@prisma/client';

export interface ServiceStatus {
  name: string;
  status: string;
  lastChecked: Date;
  responseTimeMs: number | null;
  uptime: number;
}

export interface Incident {
  id: string;
  service: string;
  severity: string;
  title: string;
  status: string;
  startedAt: Date;
  resolvedAt: Date | null;
}

@Injectable()
export class ApolloService {
  private readonly logger = new Logger(ApolloService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorServices() {
    this.logger.debug('Apollo: Running health checks');

    const services = [
      { name: 'api', url: '/health' },
      { name: 'database', check: () => this.checkDatabase() },
    ];

    for (const svc of services) {
      try {
        const start = Date.now();
        let healthy = false;

        if (svc.check) {
          healthy = await svc.check();
        } else {
          healthy = true;
        }

        const responseTime = Date.now() - start;

        await this.prisma.serviceHealth.upsert({
          where: { service: svc.name },
          update: {
            status: healthy
              ? ServiceHealthStatus.HEALTHY
              : ServiceHealthStatus.UNHEALTHY,
            latency: responseTime,
            lastCheck: new Date(),
            ...(healthy ? { lastSuccess: new Date(), failureCount: 0 } : {}),
          },
          create: {
            service: svc.name,
            status: healthy
              ? ServiceHealthStatus.HEALTHY
              : ServiceHealthStatus.UNHEALTHY,
            latency: responseTime,
            lastCheck: new Date(),
            lastSuccess: healthy ? new Date() : undefined,
          },
        });

        if (!healthy) {
          await this.createIncident(svc.name, 'Service unhealthy');
        }
      } catch (error) {
        this.logger.error(
          `Health check failed for ${svc.name}: ${error}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectPerformanceMetrics() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [ticketCount, errorCount] = await Promise.all([
      this.prisma.ticket.count({
        where: { createdAt: { gte: fiveMinAgo } },
      }),
      this.prisma.auditLog.count({
        where: {
          success: false,
          timestamp: { gte: fiveMinAgo },
        },
      }),
    ]);

    await this.prisma.monitoringMetric.create({
      data: {
        service: 'api',
        metric: 'ticket_count',
        value: ticketCount,
        unit: 'count',
        labels: { period: '5min', type: 'tickets' } as unknown as Prisma.InputJsonValue,
      },
    });

    if (errorCount > 10) {
      await this.prisma.monitoringMetric.create({
        data: {
          service: 'api',
          metric: 'error_rate',
          value: errorCount,
          unit: 'count',
          labels: { period: '5min', type: 'errors' } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  async getServicesHealth(): Promise<ServiceStatus[]> {
    const services = await this.prisma.serviceHealth.findMany({
      orderBy: { service: 'asc' },
    });

    return services.map((s) => ({
      name: s.service,
      status: s.status,
      lastChecked: s.lastCheck,
      responseTimeMs: s.latency,
      uptime: 99.9,
    }));
  }

  async getIncidents(status?: string, limit = 20): Promise<Incident[]> {
    const alerts = await this.prisma.alert.findMany({
      where: status
        ? { status: status as AlertStatus }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts.map((a) => ({
      id: a.id,
      service: a.service || 'unknown',
      severity: a.severity,
      title: a.title,
      status: a.status,
      startedAt: a.createdAt,
      resolvedAt: a.resolvedAt,
    }));
  }

  async getPerformanceMetrics(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.monitoringMetric.findMany({
      where: { timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });
  }

  async getDashboard() {
    const [services, incidents, metrics] = await Promise.all([
      this.getServicesHealth(),
      this.getIncidents(undefined, 10),
      this.getPerformanceMetrics(24),
    ]);

    const slaCompliance = await this.calculateSLACompliance();

    return { services, incidents, metrics, slaCompliance };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async createIncident(serviceName: string, description: string) {
    const existing = await this.prisma.alert.findFirst({
      where: {
        title: `service_unhealthy_${serviceName}`,
        status: AlertStatus.ACTIVE,
      },
    });

    if (!existing) {
      await this.prisma.alert.create({
        data: {
          title: `service_unhealthy_${serviceName}`,
          severity: AlertSeverity.CRITICAL,
          status: AlertStatus.ACTIVE,
          message: description,
          service: serviceName,
          metadata: { source: 'apollo' } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async calculateSLACompliance() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, breached] = await Promise.all([
      this.prisma.ticket.count({
        where: {
          slaDeadline: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.ticket.count({
        where: {
          slaBreach: true,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      total,
      breached,
      compliance: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
    };
  }
}
