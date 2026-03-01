import { Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { HealthService } from '@/modules/health/health.service';

@Injectable()
export class StatusPageService {
  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly healthService: HealthService,
  ) {}

  async getPublicStatus() {
    const health = await this.healthService.getEnrichedHealth();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentFailedWebhookLogs, unresolvedFailedJobs] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { success: false, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          event: true,
          error: true,
          statusCode: true,
          createdAt: true,
          webhook: { select: { url: true } },
        },
      }),
      this.prisma.failedJob.findMany({
        where: { resolvedAt: null, failedAt: { gte: since } },
        orderBy: { failedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          queue: true,
          error: true,
          failedAt: true,
        },
      }),
    ]);

    const incidents = [
      ...recentFailedWebhookLogs.map((log) => ({
        id: `webhook-${log.id}`,
        type: 'webhook_delivery',
        severity: 'minor',
        title: `Webhook ${log.event} en echec`,
        detail: log.error ?? `HTTP ${log.statusCode ?? 'unknown'}`,
        createdAt: log.createdAt.toISOString(),
        source: log.webhook.url,
      })),
      ...unresolvedFailedJobs.map((job) => ({
        id: `job-${job.id}`,
        type: 'job_failure',
        severity: 'major',
        title: `Job ${job.queue} en echec`,
        detail: job.error,
        createdAt: job.failedAt.toISOString(),
        source: job.queue,
      })),
    ]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10);

    const components = [
      {
        name: 'API',
        status: health.status === 'ok' ? 'operational' : 'degraded',
        latencyMs: health.dependencies.database.latencyMs ?? null,
      },
      {
        name: 'Database',
        status:
          health.dependencies.database.status === 'ok'
            ? 'operational'
            : 'degraded',
        latencyMs: health.dependencies.database.latencyMs ?? null,
      },
      {
        name: 'Redis',
        status:
          health.dependencies.redis.status === 'ok' ? 'operational' : 'degraded',
        latencyMs: health.dependencies.redis.latencyMs ?? null,
      },
      {
        name: 'Email',
        status:
          health.dependencies.email.status === 'ok' ? 'operational' : 'degraded',
        latencyMs: null,
      },
      {
        name: 'Stripe',
        status:
          health.dependencies.stripe.status === 'ok' ? 'operational' : 'degraded',
        latencyMs: null,
      },
    ];

    return {
      status: health.status === 'ok' ? 'operational' : 'degraded',
      updatedAt: new Date().toISOString(),
      components,
      incidents,
      summary: {
        uptimeSeconds: health.uptime,
        version: health.version,
        openIncidents: incidents.length,
      },
    };
  }
}
