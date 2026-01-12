/**
 * Performance Monitoring Service
 * Tracks API latency, database query performance, and system metrics
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
}

export interface DatabaseMetric {
  query: string;
  duration: number;
  table?: string;
  operation?: string;
  timestamp: Date;
}

export interface PerformanceSummary {
  api: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  database: {
    averageQueryTime: number;
    slowQueries: number;
    queriesPerMinute: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private apiMetrics: APIMetric[] = [];
  private dbMetrics: DatabaseMetric[] = [];
  private readonly maxMetrics = 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
  ) {
    this.setupDatabaseMonitoring();
  }

  /**
   * Track API call performance
   */
  trackAPICall(metric: APIMetric): void {
    this.apiMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metric.duration > 1000) {
      this.logger.warn(`Slow API request: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }

    // Log errors
    if (metric.statusCode >= 400) {
      this.logger.warn(`API error: ${metric.method} ${metric.endpoint} returned ${metric.statusCode}`);
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(metric: DatabaseMetric): void {
    this.dbMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (metric.duration > 500) {
      this.logger.warn(`Slow database query: ${metric.query} took ${metric.duration}ms`);
    }
  }

  /**
   * Setup database query monitoring via Prisma middleware
   */
  private setupDatabaseMonitoring(): void {
    // Prisma middleware for query monitoring
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;

      this.trackDatabaseQuery({
        query: `${params.model}.${params.action}`,
        duration,
        table: params.model,
        operation: params.action,
        timestamp: new Date(),
      });

      return result;
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Filter recent metrics
    const recentAPIMetrics = this.apiMetrics.filter(
      (m) => m.timestamp.getTime() > oneMinuteAgo,
    );
    const recentDBMetrics = this.dbMetrics.filter(
      (m) => m.timestamp.getTime() > oneMinuteAgo,
    );

    // Calculate API metrics
    const apiDurations = recentAPIMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const apiErrors = recentAPIMetrics.filter((m) => m.statusCode >= 400).length;

    // Calculate database metrics
    const dbDurations = recentDBMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const slowQueries = recentDBMetrics.filter((m) => m.duration > 500).length;

    return {
      api: {
        averageLatency: apiDurations.length > 0
          ? apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length
          : 0,
        p95Latency: this.percentile(apiDurations, 95),
        p99Latency: this.percentile(apiDurations, 99),
        errorRate: recentAPIMetrics.length > 0
          ? (apiErrors / recentAPIMetrics.length) * 100
          : 0,
        requestsPerMinute: recentAPIMetrics.length,
      },
      database: {
        averageQueryTime: dbDurations.length > 0
          ? dbDurations.reduce((a, b) => a + b, 0) / dbDurations.length
          : 0,
        slowQueries,
        queriesPerMinute: recentDBMetrics.length,
      },
      system: {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // Would need external library for CPU monitoring
        activeConnections: 0, // Would need to track active connections
      },
    };
  }

  /**
   * Get slow API endpoints
   */
  getSlowEndpoints(limit: number = 10): APIMetric[] {
    return this.apiMetrics
      .filter((m) => m.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get slow database queries
   */
  getSlowQueries(limit: number = 10): DatabaseMetric[] {
    return this.dbMetrics
      .filter((m) => m.duration > 500)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}
