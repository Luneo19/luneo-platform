import { Public } from '@/common/decorators/public.decorator';
import { SkipRateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthService, EnrichedHealthResponse } from './health.service';
import { IntegrationHttpClient } from '@/modules/integrations/providers/integration-http.client';

@ApiTags('Health')
@SkipRateLimit()
@Controller('health') // Will be /health (excluded from global prefix) OR /api/v1/health
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
    private readonly cloudinary: CloudinaryService, // HEALTH-01
  ) {}

  @Get()
  /** @Public: health for load balancers/monitoring */
  @Public()
  @ApiOperation({
    summary: 'Enriched health check endpoint',
    description: 'Production-ready health with dependencies: database, redis, stripe config, email config.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status with dependency checks',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        service: { type: 'string', example: 'luneo-backend' },
        version: { type: 'string', example: '1.0.0' },
        dependencies: {
          type: 'object',
          properties: {
            database: { type: 'object', properties: { status: { type: 'string' }, latencyMs: { type: 'number' } } },
            redis: { type: 'object', properties: { status: { type: 'string' }, latencyMs: { type: 'number' } } },
            stripe: { type: 'object', properties: { status: { type: 'string' } } },
            email: { type: 'object', properties: { status: { type: 'string' } } },
          },
        },
        metrics: {
          type: 'object',
          description: 'Prometheus-style request count and latency (when available)',
          properties: {
            requestCountTotal: { type: 'number' },
            latencyP95Ms: { type: 'number', nullable: true },
          },
        },
      },
    },
  })
  async getEnriched(): Promise<EnrichedHealthResponse> {
    return this.healthService.getEnrichedHealth();
  }

  @Get('ready')
  @Public()
  @ApiOperation({
    summary: 'Strict readiness check for orchestrators',
    description:
      'Retourne 200 uniquement si les dépendances critiques (database + redis) sont opérationnelles.',
  })
  @ApiResponse({ status: 200, description: 'Service ready' })
  @ApiResponse({ status: 503, description: 'Service not ready' })
  async getReadiness(): Promise<{
    status: 'ready';
    timestamp: string;
    dependencies: { database: string; redis: string };
  }> {
    const health = await this.healthService.getEnrichedHealth();
    const isDatabaseReady = health.dependencies.database.status === 'ok';
    const isRedisReady = health.dependencies.redis.status === 'ok';

    if (!isDatabaseReady || !isRedisReady) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: health.dependencies.database.status,
          redis: health.dependencies.redis.status,
        },
      });
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      dependencies: { database: 'ok', redis: 'ok' },
    };
  }

  @Get('integrations')
  @Public()
  @ApiOperation({
    summary: 'Integration health and runtime metrics',
    description: 'Expose la santé des intégrations critiques et leurs métriques d’appels runtime.',
  })
  async getIntegrationsHealth() {
    const enriched = await this.healthService.getEnrichedHealth();
    return {
      status: enriched.status,
      integrations: enriched.dependencies.integrations,
      metrics: enriched.integrationMetrics ?? IntegrationHttpClient.getGlobalMetrics(),
    };
  }

  @Get('slo')
  @Public()
  @ApiOperation({
    summary: 'SLO opérationnel 24h',
    description:
      "Expose un indicateur SLO consolidé (dépendances + queues + intégrations) avec burn rate.",
  })
  async getSloStatus() {
    return this.healthService.getSloStatus();
  }

  @Get('error-budget')
  @Public()
  @ApiOperation({
    summary: "Error budget courant",
    description:
      "Expose l'état de consommation de l'error budget pour le pilotage release/go-live.",
  })
  async getErrorBudget() {
    const slo = await this.healthService.getSloStatus();
    return {
      window: slo.window,
      objectivePercent: slo.objectivePercent,
      errorBudgetPercent: slo.errorBudgetPercent,
      errorBudgetRemainingPercent: slo.errorBudgetRemainingPercent,
      burnRate: slo.burnRate,
      status: slo.status,
    };
  }

  @Get('terminus')
  /** @Public: Terminus health for orchestrators */
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Terminus health check (legacy)',
    description: 'Vérifie la santé (database, Redis, mémoire, Cloudinary) via Terminus.',
  })
  @ApiResponse({ status: 200, description: 'Terminus health result' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health check
      async () => {
        try {
          const start = Date.now();
          await this.prisma.$queryRaw`SELECT 1`;
          const latency = Date.now() - start;
          
          return {
            database: {
              status: 'up',
              latency: `${latency}ms`,
              message: 'Database connection healthy',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Database connection failed',
            },
          };
        }
      },
      // Redis health check
      async () => {
        try {
          // Vérifier si Redis est configuré (peut être null en mode dégradé)
          if (!this.redis) {
            return {
              redis: {
                status: 'down',
                message: 'Redis not configured - running in degraded mode',
              },
            };
          }
          
          const start = Date.now();
          // Utiliser healthCheck() qui gère déjà les cas d'erreur
          const isHealthy = await this.redis.healthCheck();
          const latency = Date.now() - start;
          
          if (isHealthy) {
            return {
              redis: {
                status: 'up',
                latency: `${latency}ms`,
                message: 'Redis connection healthy',
              },
            };
          }
          
          return {
            redis: {
              status: 'down',
              message: 'Redis health check failed',
            },
          };
        } catch (error) {
          return {
            redis: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Redis connection failed',
            },
          };
        }
      },
      // Memory health check
      async () => {
        const used = process.memoryUsage();
        const totalMemory = used.heapTotal;
        const usedMemory = used.heapUsed;
        const memoryUsagePercent = (usedMemory / totalMemory) * 100;
        
        // Alert if memory usage > 90%
        const status = memoryUsagePercent > 90 ? 'down' : 'up';
        
        return {
          memory: {
            status,
            heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
            usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
            message: memoryUsagePercent > 90 
              ? 'Memory usage critical' 
              : 'Memory usage normal',
          },
        };
      },
      // HEALTH-01: Cloudinary health check
      async () => {
        try {
          const result = await this.cloudinary.healthCheck();
          return {
            cloudinary: {
              status: result.healthy ? 'up' : 'down',
              latency: `${result.latencyMs}ms`,
              message: result.healthy 
                ? 'Cloudinary connection healthy' 
                : 'Cloudinary health check failed',
            },
          };
        } catch (error) {
          return {
            cloudinary: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Cloudinary check failed',
            },
          };
        }
      },
    ]);
  }

  @Get('metrics')
  /** @Public: Prometheus scrape endpoint */
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ 
    summary: 'Prometheus metrics endpoint',
    description: 'Retourne les métriques Prometheus pour le monitoring. Format compatible avec Prometheus scraping.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics in Prometheus format',
    schema: {
      type: 'string',
      example: '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",status="200"} 1234',
    },
  })
  async getMetrics(): Promise<string> {
    const now = Date.now();
    const uptimeSeconds = Math.floor(process.uptime());
    const memory = process.memoryUsage();

    let dbUp = 0;
    let redisUp = 0;
    let dbLatencyMs = 0;
    let redisLatencyMs = 0;

    try {
      const started = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - started;
      dbUp = 1;
    } catch {
      dbUp = 0;
    }

    try {
      if (this.redis) {
        const started = Date.now();
        const healthy = await this.redis.healthCheck();
        redisLatencyMs = Date.now() - started;
        redisUp = healthy ? 1 : 0;
      }
    } catch {
      redisUp = 0;
    }

    const integrationMetrics = IntegrationHttpClient.getGlobalMetrics();
    const integrationLines = Object.entries(integrationMetrics).flatMap(([provider, metric]) => ([
      `luneo_integration_calls_total{provider="${provider}"} ${metric.calls}`,
      `luneo_integration_success_total{provider="${provider}"} ${metric.success}`,
      `luneo_integration_error_total{provider="${provider}"} ${metric.errors}`,
      `luneo_integration_avg_latency_ms{provider="${provider}"} ${metric.avgLatencyMs.toFixed(2)}`,
    ]));

    return [
      '# HELP luneo_process_uptime_seconds Process uptime in seconds',
      '# TYPE luneo_process_uptime_seconds gauge',
      `luneo_process_uptime_seconds ${uptimeSeconds}`,
      '# HELP luneo_process_heap_used_bytes Process heap used bytes',
      '# TYPE luneo_process_heap_used_bytes gauge',
      `luneo_process_heap_used_bytes ${memory.heapUsed}`,
      '# HELP luneo_process_heap_total_bytes Process heap total bytes',
      '# TYPE luneo_process_heap_total_bytes gauge',
      `luneo_process_heap_total_bytes ${memory.heapTotal}`,
      '# HELP luneo_dependency_up Dependency health (1=up, 0=down)',
      '# TYPE luneo_dependency_up gauge',
      `luneo_dependency_up{name="database"} ${dbUp}`,
      `luneo_dependency_up{name="redis"} ${redisUp}`,
      '# HELP luneo_dependency_latency_ms Dependency latency in ms',
      '# TYPE luneo_dependency_latency_ms gauge',
      `luneo_dependency_latency_ms{name="database"} ${dbLatencyMs}`,
      `luneo_dependency_latency_ms{name="redis"} ${redisLatencyMs}`,
      '# HELP luneo_metrics_generated_at_ms Metrics generation timestamp',
      '# TYPE luneo_metrics_generated_at_ms gauge',
      `luneo_metrics_generated_at_ms ${now}`,
      '# HELP luneo_integration_calls_total Total integration calls by provider',
      '# TYPE luneo_integration_calls_total counter',
      '# HELP luneo_integration_success_total Total successful integration calls by provider',
      '# TYPE luneo_integration_success_total counter',
      '# HELP luneo_integration_error_total Total failed integration calls by provider',
      '# TYPE luneo_integration_error_total counter',
      '# HELP luneo_integration_avg_latency_ms Average integration latency by provider',
      '# TYPE luneo_integration_avg_latency_ms gauge',
      ...integrationLines,
      '',
    ].join('\n');
  }

  @Get('detailed')
  /** @Public: detailed health for ops */
  @Public()
  @ApiOperation({ 
    summary: 'Detailed health check',
    description: 'Health check détaillé avec informations système (uptime, version, environnement)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 3600 },
        environment: { type: 'string', example: 'production' },
        version: { type: 'string', example: '1.0.0' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            redis: { type: 'object' },
            memory: { type: 'object' },
          },
        },
      },
    },
  })
  async getDetailed() {
    const enriched = await this.healthService.getEnrichedHealth();
    const terminusResult = await this.check();
    return {
      ...enriched,
      terminus: terminusResult,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
