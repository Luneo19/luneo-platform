import { Public } from '@/common/decorators/public.decorator';
import { PrometheusService } from '@/libs/metrics/prometheus.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health') // Will be /health (excluded from global prefix) OR /api/v1/health
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prometheus: PrometheusService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
    private readonly cloudinary: CloudinaryService, // HEALTH-01
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Vérifie la santé de l\'application et de ses dépendances (database, Redis, mémoire). Retourne le statut de chaque service.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: { type: 'object', properties: { status: { type: 'string' } } },
            redis: { type: 'object', properties: { status: { type: 'string' } } },
            memory: { type: 'object', properties: { status: { type: 'string' } } },
          },
        },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Service unhealthy - One or more dependencies are down',
  })
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
  @Public()
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
  async getMetrics() {
    const metrics = await this.prometheus.getMetrics();
    return metrics;
  }

  @Get('detailed')
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
    const healthResult = await this.check();
    
    return {
      ...healthResult,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
