import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { ALL_QUEUE_NAMES } from '@/libs/queues/queues.constants';
import { IntegrationHttpClient, IntegrationProviderMetric } from '@/modules/integrations/providers/integration-http.client';

export interface DependencyStatus {
  status: 'ok' | 'degraded' | 'unavailable';
  latencyMs?: number;
  message?: string;
}

export interface RedisDetailedStatus extends DependencyStatus {
  memoryUsed?: string;
  memoryPeak?: string;
  connectedClients?: number;
  totalKeys?: number;
}

export interface QueueHealthStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface HealthMetrics {
  requestCountTotal: number;
  latencyP95Ms: number | null;
}

export interface SloStatusResponse {
  window: string;
  objectivePercent: number;
  currentAvailabilityPercent: number;
  errorRatePercent: number;
  errorBudgetPercent: number;
  errorBudgetRemainingPercent: number;
  burnRate: number;
  status: 'healthy' | 'at_risk' | 'breached';
  indicators: {
    dependencyAvailabilityPercent: number;
    queueSuccessRatePercent: number;
    integrationSuccessRatePercent: number;
  };
}

export interface EnrichedHealthResponse {
  status: 'ok' | 'degraded' | 'unavailable';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  dependencies: {
    database: DependencyStatus;
    redis: RedisDetailedStatus;
    stripe: DependencyStatus;
    email: DependencyStatus;
    integrations: Record<string, DependencyStatus>;
  };
  integrationMetrics?: Record<string, IntegrationProviderMetric>;
  queues?: QueueHealthStatus[];
  metrics?: HealthMetrics;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly serviceName = 'luneo-backend';
  private readonly version = process.env.npm_package_version || '1.0.0';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns enriched health with dependency checks (database, redis, stripe config, email config).
   */
  async getEnrichedHealth(): Promise<EnrichedHealthResponse> {
    const [database, redis, stripe, email, integrations, queues] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkEmail(),
      this.checkIntegrations(),
      this.checkQueues(),
    ]);

    const integrationStatuses = Object.values(integrations).map((s) => s.status);
    const statuses = [database.status, redis.status, stripe.status, email.status, ...integrationStatuses];
    const overallStatus = statuses.every((s) => s === 'ok')
      ? 'ok'
      : statuses.some((s) => s === 'unavailable')
        ? 'unavailable'
        : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: this.serviceName,
      version: this.version,
      dependencies: {
        database,
        redis,
        stripe,
        email,
        integrations,
      },
      integrationMetrics: IntegrationHttpClient.getGlobalMetrics(),
      queues,
    };
  }

  async getSloStatus(): Promise<SloStatusResponse> {
    const [database, redis, stripe, email, integrations, queues] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkEmail(),
      this.checkIntegrations(),
      this.checkQueues(),
    ]);

    const dependencyStatuses = [
      database.status,
      redis.status,
      stripe.status,
      email.status,
      ...Object.values(integrations).map((item) => item.status),
    ];
    const okDependencies = dependencyStatuses.filter((status) => status === 'ok').length;
    const dependencyAvailabilityPercent =
      dependencyStatuses.length > 0
        ? (okDependencies / dependencyStatuses.length) * 100
        : 100;

    const queueCompleted = queues.reduce((sum, queue) => sum + queue.completed, 0);
    const queueFailed = queues.reduce((sum, queue) => sum + queue.failed, 0);
    const queueTotal = queueCompleted + queueFailed;
    const queueSuccessRatePercent =
      queueTotal > 0 ? (queueCompleted / queueTotal) * 100 : 100;

    const integrationMetrics = IntegrationHttpClient.getGlobalMetrics();
    const integrationAggregate = Object.values(integrationMetrics).reduce(
      (acc, metric) => {
        acc.success += metric.success;
        acc.errors += metric.errors;
        return acc;
      },
      { success: 0, errors: 0 },
    );
    const integrationTotal = integrationAggregate.success + integrationAggregate.errors;
    const integrationSuccessRatePercent =
      integrationTotal > 0
        ? (integrationAggregate.success / integrationTotal) * 100
        : 100;

    // Weighted operational availability score.
    const currentAvailabilityPercent =
      dependencyAvailabilityPercent * 0.5 +
      queueSuccessRatePercent * 0.3 +
      integrationSuccessRatePercent * 0.2;

    const objectivePercent = 99.9;
    const errorBudgetPercent = Math.max(0, 100 - objectivePercent);
    const errorRatePercent = Math.max(0, 100 - currentAvailabilityPercent);
    const errorBudgetRemainingPercent =
      errorBudgetPercent > 0
        ? ((errorBudgetPercent - errorRatePercent) / errorBudgetPercent) * 100
        : 0;
    const burnRate =
      errorBudgetPercent > 0 ? errorRatePercent / errorBudgetPercent : 0;

    const status: SloStatusResponse['status'] =
      errorBudgetRemainingPercent <= 0
        ? 'breached'
        : errorBudgetRemainingPercent < 25
          ? 'at_risk'
          : 'healthy';

    return {
      window: 'rolling-24h',
      objectivePercent,
      currentAvailabilityPercent: this.round(currentAvailabilityPercent),
      errorRatePercent: this.round(errorRatePercent),
      errorBudgetPercent: this.round(errorBudgetPercent),
      errorBudgetRemainingPercent: this.round(errorBudgetRemainingPercent),
      burnRate: this.round(burnRate),
      status,
      indicators: {
        dependencyAvailabilityPercent: this.round(dependencyAvailabilityPercent),
        queueSuccessRatePercent: this.round(queueSuccessRatePercent),
        integrationSuccessRatePercent: this.round(integrationSuccessRatePercent),
      },
    };
  }

  private checkIntegrations(): Promise<Record<string, DependencyStatus>> {
    const statuses: Record<string, DependencyStatus> = {};

    statuses.hubspot =
      this.configService.get<string>('HUBSPOT_API_KEY')
        ? { status: 'ok' }
        : { status: 'degraded', message: 'HUBSPOT_API_KEY not configured' };

    statuses.salesforce =
      this.configService.get<string>('SALESFORCE_ACCESS_TOKEN') &&
      this.configService.get<string>('SALESFORCE_INSTANCE_URL')
        ? { status: 'ok' }
        : { status: 'degraded', message: 'Salesforce credentials not fully configured' };

    statuses.google_calendar =
      this.configService.get<string>('GOOGLE_CALENDAR_ACCESS_TOKEN')
        ? { status: 'ok' }
        : { status: 'degraded', message: 'GOOGLE_CALENDAR_ACCESS_TOKEN not configured' };

    statuses.calendly =
      this.configService.get<string>('CALENDLY_API_KEY')
        ? { status: 'ok' }
        : { status: 'degraded', message: 'CALENDLY_API_KEY not configured' };

    return Promise.resolve(statuses);
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return { status: 'ok', latencyMs };
    } catch (error) {
      return {
        status: 'unavailable',
        message: 'Service unavailable',
      };
    }
  }

  private async checkRedis(): Promise<RedisDetailedStatus> {
    try {
      const start = Date.now();
      const healthy = await this.redis.healthCheck();
      const latencyMs = Date.now() - start;

      if (!healthy) {
        return { status: 'unavailable', latencyMs, message: 'Redis health check failed' };
      }

      // Get detailed Redis info
      const details: RedisDetailedStatus = { status: 'ok', latencyMs };

      try {
        const client = this.redis.client;
        if (client) {
          const info = await client.info('memory');
          const memUsedMatch = info.match(/used_memory_human:(\S+)/);
          const memPeakMatch = info.match(/used_memory_peak_human:(\S+)/);
          if (memUsedMatch) details.memoryUsed = memUsedMatch[1];
          if (memPeakMatch) details.memoryPeak = memPeakMatch[1];

          const clientInfo = await client.info('clients');
          const clientsMatch = clientInfo.match(/connected_clients:(\d+)/);
          if (clientsMatch) details.connectedClients = parseInt(clientsMatch[1], 10);

          const keyspaceInfo = await client.info('keyspace');
          const keysMatch = keyspaceInfo.match(/keys=(\d+)/);
          if (keysMatch) details.totalKeys = parseInt(keysMatch[1], 10);
        }
      } catch (statsErr) {
        this.logger.debug('Could not fetch Redis detailed stats', statsErr);
      }

      return details;
    } catch (error) {
      return {
        status: 'unavailable',
        message: 'Service unavailable',
      };
    }
  }

  private checkStripe(): Promise<DependencyStatus> {
    const secretKey = this.configService.get<string>('stripe.secretKey') || this.configService.get<string>('STRIPE_SECRET_KEY');
    const status = secretKey && typeof secretKey === 'string' && secretKey.startsWith('sk_')
      ? 'ok'
      : 'degraded';
    return Promise.resolve({
      status,
      ...(status !== 'ok' && { message: 'Stripe secret key not configured' }),
    });
  }

  private checkEmail(): Promise<DependencyStatus> {
    const sendgridKey = this.configService.get<string>('email.sendgridApiKey') || this.configService.get<string>('SENDGRID_API_KEY');
    const mailgunKey = this.configService.get<string>('email.mailgunApiKey') || this.configService.get<string>('MAILGUN_API_KEY');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpFrom = this.configService.get<string>('SMTP_FROM');
    const hasSmtp = !!(smtpHost && smtpFrom);
    const configured = !!(sendgridKey || mailgunKey || hasSmtp);
    const status = configured ? 'ok' : 'degraded';
    return Promise.resolve({
      status,
      ...(status !== 'ok' && { message: 'No email provider configured (SENDGRID_API_KEY, MAILGUN, or SMTP)' }),
    });
  }

  /**
   * Check BullMQ queue health via Redis keys
   * Returns waiting/active/failed/completed counts per queue
   */
  private async checkQueues(): Promise<QueueHealthStatus[]> {
    const queueNames = ALL_QUEUE_NAMES;
    const results: QueueHealthStatus[] = [];

    try {
      const client = this.redis.client;
      if (!client) return [];

      for (const name of queueNames) {
        try {
          const prefix = `bull:${name}`;
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            client.llen(`${prefix}:wait`).catch(() => 0),
            client.llen(`${prefix}:active`).catch(() => 0),
            client.zcard(`${prefix}:completed`).catch(() => 0),
            client.zcard(`${prefix}:failed`).catch(() => 0),
            client.zcard(`${prefix}:delayed`).catch(() => 0),
          ]);
          results.push({ name, waiting, active, completed, failed, delayed });
        } catch {
          results.push({ name, waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 });
        }
      }
    } catch (err) {
      this.logger.debug('Could not fetch queue stats', err);
    }

    return results;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
