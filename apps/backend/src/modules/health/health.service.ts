import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

export interface DependencyStatus {
  status: 'ok' | 'degraded' | 'unavailable';
  latencyMs?: number;
  message?: string;
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
    redis: DependencyStatus;
    stripe: DependencyStatus;
    email: DependencyStatus;
  };
  metrics?: HealthMetrics;
}

@Injectable()
export class HealthService {
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
    const [database, redis, stripe, email] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkEmail(),
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
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    try {
      const start = Date.now();
      const healthy = await this.redis.healthCheck();
      const latencyMs = Date.now() - start;
      if (healthy) {
        return { status: 'ok', latencyMs };
      }
      return {
        status: 'unavailable',
        latencyMs,
        message: 'Redis health check failed',
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Redis not available',
      };
    }
  }

  private checkStripe(): Promise<DependencyStatus> {
    const secretKey = this.configService.get<string>('stripe.secretKey') || process.env.STRIPE_SECRET_KEY;
    const status = secretKey && typeof secretKey === 'string' && secretKey.startsWith('sk_')
      ? 'ok'
      : 'degraded';
    return Promise.resolve({
      status,
      ...(status !== 'ok' && { message: 'Stripe secret key not configured' }),
    });
  }

  private checkEmail(): Promise<DependencyStatus> {
    const sendgridKey = this.configService.get<string>('email.sendgridApiKey') || process.env.SENDGRID_API_KEY;
    const mailgunKey = this.configService.get<string>('email.mailgunApiKey') || process.env.MAILGUN_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpFrom = process.env.SMTP_FROM;
    const hasSmtp = !!(smtpHost && smtpFrom);
    const configured = !!(sendgridKey || mailgunKey || hasSmtp);
    const status = configured ? 'ok' : 'degraded';
    return Promise.resolve({
      status,
      ...(status !== 'ok' && { message: 'No email provider configured (SENDGRID_API_KEY, MAILGUN, or SMTP)' }),
    });
  }
}
