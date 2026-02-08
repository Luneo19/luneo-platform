/**
 * ★★★ HEALTH CHECK SERVICE ★★★
 * Service pour vérifier la santé de l'application
 */

import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: 'ok' | 'error';
    api: 'ok' | 'error';
    storage: 'ok' | 'error';
    cache: 'ok' | 'error';
  };
  details?: Record<string, any>;
}

class HealthCheckService {
  private static instance: HealthCheckService;

  private constructor() {}

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Vérifie la santé de l'application
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks: {
      database: 'ok' | 'error';
      api: 'ok' | 'error';
      storage: 'ok' | 'error';
      cache: 'ok' | 'error';
    } = {
      database: 'ok',
      api: 'ok',
      storage: 'ok',
      cache: 'ok',
    };

    try {
      // Database is accessed via NestJS backend only; API health implies DB connectivity
      // Check API (NestJS backend)
      try {
        await api.get('/api/v1/health');
      } catch (error) {
        checks.api = 'error';
        checks.database = 'error';
        logger.error('API health check failed', { error });
      }

      // Check storage (S3/R2)
      try {
        // Simple check - verify env vars are set
        if (!process.env.S3_BUCKET && !process.env.R2_BUCKET) {
          checks.storage = 'error';
        }
      } catch (error) {
        checks.storage = 'error';
        logger.error('Storage health check failed', { error });
      }

      // Check cache (Redis)
      try {
        const { cacheService } = await import('@/lib/cache/CacheService');
        await cacheService.get('health-check');
      } catch (error) {
        checks.cache = 'error';
        logger.error('Cache health check failed', { error });
      }

      // Determine overall status
      const errorCount = Object.values(checks).filter((c) => c === 'error').length;
      let status: HealthStatus['status'] = 'healthy';
      if (errorCount > 0 && errorCount < Object.keys(checks).length) {
        status = 'degraded';
      } else if (errorCount === Object.keys(checks).length) {
        status = 'unhealthy';
      }

      return {
        status,
        timestamp: new Date(),
        checks,
      };
    } catch (error) {
      logger.error('Health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        checks: {
          database: 'error',
          api: 'error',
          storage: 'error',
          cache: 'error',
        },
      };
    }
  }
}

export const healthCheckService = HealthCheckService.getInstance();

