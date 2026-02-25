import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { ALL_QUEUE_NAMES } from '@/libs/queues/queues.constants';

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
  };
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
    const [database, redis, stripe, email, queues] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkEmail(),
      this.checkQueues(),
    ]);

    const statuses = [database.status, redis.status, stripe.status, email.status];
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
      },
      queues,
    };
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
}
