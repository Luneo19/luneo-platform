// @ts-nocheck
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AlertSeverity } from '@prisma/client';

export interface ServiceHealth {
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  database: ServiceHealth;
  redis: ServiceHealth;
  queue: ServiceHealth;
  storage: ServiceHealth;
  aiProviders: ServiceHealth;
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

export interface KeyMetrics {
  responseTimeP95Ms: number | null;
  errorRate: number;
  queueDepth: number;
  activeUsers24h: number;
  period: { from: Date; to: Date };
}

export interface AlertConfig {
  name: string;
  service: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity?: AlertSeverity;
  notificationChannel?: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const database = await this.checkDatabase();
    const redis: ServiceHealth = { status: 'unknown', message: 'Not checked by this service' };
    const queue: ServiceHealth = { status: 'unknown', message: 'Not checked by this service' };
    const storage: ServiceHealth = { status: 'unknown', message: 'Not checked by this service' };
    const aiProviders: ServiceHealth = { status: 'unknown', message: 'Not checked by this service' };
    const downs = [database].filter((s) => s.status === 'down').length;
    const overall = downs > 0 ? 'unhealthy' : database.status === 'up' ? 'healthy' : 'degraded';
    return { database, redis, queue, storage, aiProviders, overall };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return { status: 'up', latencyMs, message: 'OK' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Database check failed';
      this.logger.warn('Database health check failed', message);
      return { status: 'down', message };
    }
  }

  async getMetrics(period: 'hour' | 'day' | 'week'): Promise<KeyMetrics> {
    const to = new Date();
    const from = new Date();
    if (period === 'hour') from.setHours(from.getHours() - 1);
    else if (period === 'day') from.setDate(from.getDate() - 1);
    else from.setDate(from.getDate() - 7);
    const [activeUsers, usageRows] = await Promise.all([
      this.prisma.user.count({ where: { lastLoginAt: { gte: from }, deletedAt: null } }),
      this.prisma.usageMetric.findMany({
        where: { timestamp: { gte: from, lte: to }, metric: { in: ['api_calls', 'errors', 'response_time_ms'] } },
      }),
    ]);
    let responseTimeP95Ms: number | null = null;
    let totalRequests = 0;
    let totalErrors = 0;
    const responseTimes: number[] = [];
    for (const row of usageRows) {
      if (row.metric === 'api_calls') totalRequests += row.value;
      else if (row.metric === 'errors') totalErrors += row.value;
      else if (row.metric === 'response_time_ms') {
        responseTimes.push(row.value);
        const meta = row.metadata as { p95?: number } | null;
        if (meta?.p95 != null) responseTimeP95Ms = meta.p95;
      }
    }
    if (responseTimeP95Ms == null && responseTimes.length > 0) {
      responseTimes.sort((a, b) => a - b);
      const idx = Math.floor(responseTimes.length * 0.95) - 1;
      responseTimeP95Ms = idx >= 0 ? responseTimes[idx]! : responseTimes[0]!;
    }
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    return { responseTimeP95Ms, errorRate, queueDepth: 0, activeUsers24h: activeUsers, period: { from, to } };
  }

  async createAlert(config: AlertConfig): Promise<{ id: string }> {
    if (!config.name?.trim() || !config.service || !config.metric || config.threshold == null) {
      throw new BadRequestException('name, service, metric, and threshold are required');
    }
    const condition = ['gt', 'lt', 'eq', 'gte', 'lte'].includes(config.condition) ? config.condition : 'gt';
    try {
      const rule = await this.prisma.alertRule.create({
        data: {
          name: config.name.trim(),
          service: config.service,
          metric: config.metric,
          condition,
          threshold: Number(config.threshold),
          severity: config.severity ?? AlertSeverity.WARNING,
          enabled: true,
          metadata: config.notificationChannel ? { notificationChannel: config.notificationChannel } : undefined,
        },
      });
      this.logger.log(`Alert rule created: ${rule.id}`);
      return { id: rule.id };
    } catch (error) {
      this.logger.error('Failed to create alert rule', error);
      throw new InternalServerErrorException('Failed to create alert rule');
    }
  }
}
